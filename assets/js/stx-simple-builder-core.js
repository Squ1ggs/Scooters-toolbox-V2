(() => {
  'use strict';

  const $ = (id)=>document.getElementById((id==='itemType')?'stx_itemType':(id==='manufacturer')?'stx_manufacturer':id);

  
  // Bridge parent datasets into this srcdoc iframe (host page keeps canonical copies).
  try{
    if (!window.STX_DATASET && window.parent && window.parent.STX_DATASET) window.STX_DATASET = window.parent.STX_DATASET;
    if (!window.STX_RARITIES && window.parent && window.parent.STX_RARITIES) window.STX_RARITIES = window.parent.STX_RARITIES;
  }catch(_e){}

  const state = {
    __seedEnabled: false,
    itemType: '',
    manufacturer: '',
    weaponType: '',
    level: 60,
    rarity: '',
    idMode: true,
    allParts: false,
    swapBodyLegendary: false,

    detectedCategory: null,
    mainPart: null, // part object
    // slot selections: key -> part object
    slots: {},
    // elements
    primaryElement: '',
    elementStack: [],
    // extras from import
    extras: []
  };

  try{
    // Keep STX/simple state isolated; do not clobber an existing main-page `window.state`.
    window.__STX_SIMPLE_STATE = state;
    window.__BL4_EDITOR_STATE = state;
    if (!window.state || window.state === window.__STX_SIMPLE_STATE || window.state === window.__BL4_EDITOR_STATE){
      window.state = state;
    }
  }catch(_e){}

  const ELEMENTS = [
    {key:'None', label:'No Element', code:''},
    {key:'Corrosive', label:'Corrosive', code:'{1:10}'},
    {key:'Cryo', label:'Cryo', code:'{1:11}'},
    {key:'Fire', label:'Fire', code:'{1:12}'},
    {key:'Radiation', label:'Radiation', code:'{1:13}'},
    {key:'Shock', label:'Shock', code:'{1:14}'}
  ];

  function stxPresetElementDropdownLabel(e){
    if (!e) return '-';
    const label = e.label != null ? String(e.label) : String(e.key || '');
    const code = e.code != null ? String(e.code).trim() : '';
    if (!code) return label;
    return label + ' (' + code + ')';
  }

  const CLASSMOD_ELEMENT_OVERRIDES = [
    {key:'Kinetic Override', label:'Kinetic Override', code:'{1:55}'},
    {key:'Shock Override', label:'Shock Override', code:'{1:56}'},
    {key:'Radiation Override', label:'Radiation Override', code:'{1:57}'},
    {key:'Corrosive Override', label:'Corrosive Override', code:'{1:58}'},
    {key:'Cryo Override', label:'Cryo Override', code:'{1:59}'},
    {key:'Incendiary Override', label:'Incendiary Override', code:'{1:60}'}
  ];

  const PEARL_FALLBACK_ROWS = [
    {itemId:51, itemTypeString:'pearl_damage', legendaryName:'Pearlescent - Damage'},
    {itemId:52, itemTypeString:'pearl_reload', legendaryName:'Pearlescent - Reload'},
    {itemId:53, itemTypeString:'pearl_firerate', legendaryName:'Pearlescent - Fire Rate'},
    {itemId:54, itemTypeString:'pearl_handling', legendaryName:'Pearlescent - Handling'},
    {itemId:55, itemTypeString:'pearl_normal', legendaryName:'Pearlescent - Kinetic Override'},
    {itemId:56, itemTypeString:'pearl_shock', legendaryName:'Pearlescent - Shock Override'},
    {itemId:57, itemTypeString:'pearl_radiation', legendaryName:'Pearlescent - Radiation Override'},
    {itemId:58, itemTypeString:'pearl_corrosive', legendaryName:'Pearlescent - Corrosive Override'},
    {itemId:59, itemTypeString:'pearl_cryo', legendaryName:'Pearlescent - Cryo Override'},
    {itemId:60, itemTypeString:'pearl_fire', legendaryName:'Pearlescent - Incendiary Override'}
  ];
  // Known pearlescent weapon-item barrel entries from the 2026-02-27 update list.
  const PEARL_WEAPON_MAINPART_ID_SET = new Set([
    '11:81','14:78','13:82','18:99','23:22','6:77','4:84','12:78','25:81','21:80','9:99','17:82','22:91','3:82','7:55'
  ]);
  const PEARL_WEAPON_MAINPART_HINTS = [
    'eigenburst','laserdisc','mercredi','bubbles','tankbuster','handcannon','roulette',
    'arctic','conflux','songbird','doeshot','fleabag','mercury','shalashaska','demo'
  ];

  const CORE_PARTTYPE_BY_CATEGORY = {
    Weapon: 'Rarity',
    Shield: 'Rarity',
    Repkit: 'Base',
    Grenade: 'Base',
    Gadget: 'Base',
    Enhancement: 'Core',
    Character: 'Body',
    'Class Mod': 'Body',
    Other: 'Base'
  };

  /** Preset full-item serials for AI / vehicle / turret-style gear (same pool as advanced search "AI Car Guns"). */
  const STX_SIMPLE_AICAR_DEFAULTS = [
    { name: 'GIANT ROOCKET LAUNCHER', code: '383, 0, 1, 50| 2, 420|| {287:7} {2}|' },
    { name: 'Maliwan Car part', code: '390, 0, 1, 50| 2, 420|| {287:7} {2}|' },
    { name: 'Minigun', code: '239, 0, 1, 50| 2, 3765|| {273:34}|' },
    { name: 'RPG', code: '240, 0, 1, 50| 2, 3765|| {8:1}|' },
    { name: 'Flamethrower', code: '391, 0, 1, 50| 2, 420|| {287:7} {2}|' }
  ];

  function getAicarSimpleBuilderParts(){
    const src = (Array.isArray(window.AI_CAR_GUNS) && window.AI_CAR_GUNS.length)
      ? window.AI_CAR_GUNS
      : STX_SIMPLE_AICAR_DEFAULTS;
    const out = [];
    for (let i = 0; i < src.length; i++){
      const g = src[i];
      const full = String((g && g.code) || '').replace(/^"+|"+$/g, '').trim();
      if (!full) continue;
      const name = String((g && g.name) || '').trim() || `Preset ${i + 1}`;
      out.push({
        name,
        __fullDeserialized: full,
        code: `"${full}"`,
        category: 'Other',
        itemType: 'Other',
        manufacturer: 'AI Car Guns',
        partType: 'AI Car Guns',
        weaponType: '',
        idRaw: '',
        id: null,
        __isAicarFullItem: true
      });
    }
    return out;
  }

  /** Fallback when slug missing from `NCS_SLOT_MAP` (e.g. offline). */
  const WEAPON_SLOT_SCHEMA = [
    {key:'body', label:'Body', partType:'Body'},
    {key:'bodyAcc', label:'Body Accessory', partType:'Body Accessory'},
    {key:'barrel', label:'Barrel', partType:'Barrel'},
    {key:'barrelAcc', label:'Barrel Accessory', partType:'Barrel Accessory'},
    {key:'mag', label:'Magazine', partType:'Magazine'},
    {key:'scope', label:'Scope', partType:'Scope'},
    {key:'scopeAcc', label:'Scope Accessory', partType:'Scope Accessory'},
    {key:'grip', label:'Grip', partType:'Grip'},
    {key:'foregrip', label:'Foregrip', partType:'Foregrip'},
    {key:'underbarrel', label:'Underbarrel', partType:'Underbarrel'},
    {key:'rarity', label:'Rarity ID Override (optional)', partType:'Rarity'},
    {key:'licensed', label:'Licensed Manufacturer Part', partType:'Manufacturer Part'},
    {key:'statMod', label:'Stat Modifier', partType:'Stat Modifier'},
    {key:'firmware', label:'Firmware', partType:'Firmware'},
    {key:'legendary', label:'Legendary Perks', partType:'Legendary Perks', multi:true},
  ];

  function getActiveWeaponSlotSchema(){
    try{
      const slug = typeof window.computeSimpleBuilderItemSlug === 'function' ? window.computeSimpleBuilderItemSlug(state) : '';
      const built = typeof window.buildWeaponSlotSchemaFromNcs === 'function' ? window.buildWeaponSlotSchemaFromNcs(slug) : null;
      if (built && built.length) return built;
    }catch(_e){}
    return WEAPON_SLOT_SCHEMA;
  }

  function applyWeaponNcsSlotOptionFilter(ncsSlot, rawOpts){
    if (!ncsSlot || !Array.isArray(rawOpts)) return rawOpts;
    const lower = (p)=> String(normCode(p && p.code)||'').toLowerCase();
    const filt = (pred)=>{ const o = rawOpts.filter(pred); return o.length ? o : rawOpts; };
    switch (ncsSlot){
      case 'hyperion_secondary_acc': return filt(p => lower(p).includes('part_shield'));
      case 'body':
        return rawOpts.filter(p => {
          const lo = lower(p);
          return !lo.includes('part_body_bolt') && !lo.includes('part_body_flap');
        });
      case 'magazine_ted_thrown': return filt(p => lower(p).includes('mag_ted_thrown'));
      case 'magazine_borg': return filt(p => /mag_05_borg|mag_.*_borg/i.test(lower(p)));
      case 'magazine_acc': {
        const o = rawOpts.filter(p => {
          const lo = lower(p);
          if (typeof window.magazineAccessoryCodeMatchLo === 'function') return window.magazineAccessoryCodeMatchLo(lo);
          return /mag_acc|magazine_acc/i.test(lo) || (lo.includes('part_mag') && lo.includes('acc'));
        });
        return o.length ? o : rawOpts;
      }
      case 'secondary_ammo': return filt(p => lower(p).includes('part_secondary_ammo'));
      case 'barrel_licensed': return filt(p => lower(p).includes('barrel_licensed'));
      case 'body_mag': return filt(p => lower(p).includes('part_body_mag'));
      case 'underbarrel_acc':
        return (()=>{ const o = rawOpts.filter(p => /underbarrel_.*_acc/i.test(lower(p)) && !/acc_vis/i.test(lower(p))); return o.length ? o : rawOpts; })();
      case 'underbarrel_acc_vis': return filt(p => /underbarrel_.*acc_vis/i.test(lower(p)));
      case 'body_bolt': return filt(p => lower(p).includes('bolt'));
      case 'tediore_acc': return filt(p => /TED_.*part_.*(multi|mirv|homing|jav|legs)/i.test(lower(p)) || /barrel_licensed_multi/i.test(lower(p)));
      case 'tediore_secondary_acc': return filt(p => /TED_.*part_.*secondary/i.test(lower(p)));
      default:
        if (ncsSlot === 'pearl_elem' || ncsSlot === 'pearl_stat') return filt(p => /part_pearl/i.test(lower(p)));
        return rawOpts;
    }
  }

  function weaponPartMatchesNcsSlot(p, ncsSlot){
    if (!p || !ncsSlot) return true;
    const lo = String(normCode(p.code)||'').toLowerCase();
    switch (ncsSlot){
      case 'hyperion_secondary_acc': return lo.includes('part_shield');
      case 'magazine_ted_thrown': return lo.includes('mag_ted_thrown');
      case 'magazine_borg': return /mag_05_borg|mag_.*_borg/i.test(lo);
      case 'magazine_acc':
        if (typeof window.magazineAccessoryCodeMatchLo === 'function') return window.magazineAccessoryCodeMatchLo(lo);
        return /mag_acc|magazine_acc/i.test(lo) || (lo.includes('part_mag') && lo.includes('acc'));
      case 'secondary_ammo': return lo.includes('part_secondary_ammo');
      case 'barrel_licensed': return lo.includes('barrel_licensed');
      case 'body_mag': return lo.includes('part_body_mag');
      case 'underbarrel_acc': return /underbarrel_.*_acc/i.test(lo) && !/acc_vis/i.test(lo);
      case 'underbarrel_acc_vis': return /underbarrel_.*acc_vis/i.test(lo);
      case 'body':
        if (lo.includes('part_body_bolt') || lo.includes('part_body_flap')) return false;
        return true;
      case 'body_acc':
        return true;
      case 'body_bolt':
        return lo.includes('part_body_bolt') || lo.includes('part_body_flap');
      case 'secondary_ele': return lo.includes('part_secondary_elem') && lo.includes('_mal');
      case 'pearl_elem':
      case 'pearl_stat': return /part_pearl/i.test(lo);
      case 'tediore_acc': return /TED_.*part_.*(multi|mirv|homing|jav|legs)/i.test(lo) || /barrel_licensed_multi/i.test(lo);
      case 'tediore_secondary_acc': return /TED_.*part_.*secondary/i.test(lo);
      default: return true;
    }
  }

  const SIMPLE_SCHEMA_BY_CATEGORY = {
    Shield: [
      {key:'mainBody', label:'Main Part', partType:'Body'},
      {key:'bodyLegendary', label:'Body - Legendary Perk', partType:'', multi:true},
      {key:'resistance', label:'Resistance', partType:''},
      {key:'primary246', label:'Primary Perks 246', partType:'Perk'},
      {key:'secondary246', label:'Secondary Perks 246', partType:'Perk'},
      {key:'armor237', label:'Armor 237', partType:''},
      {key:'energy248', label:'Energy 248', partType:''},
      {key:'firmware246', label:'Firmware 246', partType:'Firmware'},
      {key:'elementType1', label:'Element (TypeID 1)', partType:'TypeID1Element', customType:'type1Element'}
    ],
    Repkit: [
      {key:'rarity', label:'Legendary ID', partType:'Rarity'},
      {key:'augment', label:'Augment', partType:'Augment', multi:true},
      {key:'perk', label:'Perk', partType:'Perk', multi:true},
      {key:'firmware', label:'Firmware', partType:'Firmware'},
      {key:'legendary', label:'Legendary Perks', partType:'Legendary Perks', multi:true},
      {key:'special', label:'Special / Unique', partType:''}
    ],
    Grenade: [
      {key:'firmware', label:'Firmware', partType:'Firmware'},
      {key:'payload', label:'Payload', partType:'Payload', multi:true},
      {key:'augment', label:'Augment', partType:'Augment', multi:true},
      {key:'special', label:'Special / Unique', partType:''}
    ],
    Gadget: [
      {key:'body', label:'Body', partType:'Body'},
      {key:'bodyAcc', label:'Body Accessory', partType:'Body Accessory'},
      {key:'barrel', label:'Barrel', partType:'Barrel'},
      {key:'barrelAcc', label:'Barrel Accessory', partType:'Barrel Accessory'},
      {key:'payload', label:'Payload', partType:'Payload', multi:true},
      {key:'augment', label:'Augment', partType:'Augment', multi:true},
      {key:'rarity', label:'Legendary ID', partType:'Rarity'},
      {key:'firmware', label:'Firmware', partType:'Firmware'},
      {key:'legendary', label:'Legendary Perks', partType:'Legendary Perks', multi:true},
      {key:'special', label:'Special / Unique', partType:''}
    ],
    Enhancement: [
      {key:'body', label:'Body', partType:'Body'},
      {key:'rarity', label:'Rarity ID (Optional)', partType:'Rarity'},
      {key:'stats', label:'Stats', partType:'Stats', multi:true},
      {key:'legendary', label:'Legendary Perks', partType:'Legendary Perks', multi:true},
      {key:'legendary2', label:'Legendary Perk 2', partType:'Legendary Perks'},
      {key:'special', label:'Special / Unique', partType:'', multi:true},
      {key:'firmware', label:'Firmware', partType:'Firmware'},
      {key:'element', label:'Elements', partType:'Status', multi:true}
    ],
    Character: [
      {key:'rarity', label:'Legendary ID', partType:'Rarity'},
      {key:'perk', label:'Perk', partType:'Perk', multi:true},
      {key:'firmware', label:'Firmware', partType:'Firmware'},
      {key:'special', label:'Special / Unique', partType:''}
    ]
,
'Class Mod': [
  {key:'perk', label:'Perks', partType:'Skill', multi:true},
  {key:'secondary', label:'Secondary Parts', partType:'Secondary', multi:true},
  {key:'universal', label:'Universal Parts', partType:'Universal', multi:true},
  {key:'element', label:'Element Override', partType:'Element', customType:'classModElement'},
  {key:'firmware', label:'Firmware', partType:'Firmware'}
]
  };

  function normCode(code){
    if (code == null) return '';
    const s = String(code).trim();
    // dataset stores code with quotes (e.g. "DAD_AR.part_x")
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1,-1);
    return s;
  }

  /**
   * Curated pearlescent rarity-id names (normalized: lowercase, alphanumeric only).
   * Pearl pip / aug art in rarity and related dropdowns is limited to these rows.
   */
  window.STX_PEARL_RARITY_ID_ALLOWLIST_NORM = {
    iigenburst: true,
    eigenburst: true,
    handcannon: true,
    vestigialconflux: true,
    conflux: true,
    soulsurvivor: true,
    crazedearl: true,
    crowsourced: true,
    crowdsourced: true,
    shalashaska: true
  };

  function stxNormPearlAllowKey(s){
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function stxRarityLegendTokenFromPart(p){
    if (!p) return '';
    const code = normCode(p.code || p.spawnCode || p.importCode || '').toLowerCase();
    const i = code.indexOf('comp_05_legendary_');
    if (i !== -1) return stxNormPearlAllowKey(code.slice(i + 'comp_05_legendary_'.length));
    return '';
  }

  function stxPartMatchesPearlRarityIdAllowlist(p){
    const allow = window.STX_PEARL_RARITY_ID_ALLOWLIST_NORM;
    if (!p || !allow) return false;
    const keys = [
      stxNormPearlAllowKey(p.effects),
      stxNormPearlAllowKey(p.effect),
      stxNormPearlAllowKey(p.name),
      stxNormPearlAllowKey(p.legendaryName),
      stxRarityLegendTokenFromPart(p)
    ];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] && allow[keys[i]]) return true;
    }
    const eff0 = String(p.effects || p.effect || '').split(/\s*-\s*/)[0];
    if (eff0 && allow[stxNormPearlAllowKey(eff0)]) return true;
    const n0 = String(p.name || '').split(/\s*-\s*/)[0];
    if (n0 && allow[stxNormPearlAllowKey(n0)]) return true;
    return false;
  }
  try { window.stxPartMatchesPearlRarityIdAllowlist = stxPartMatchesPearlRarityIdAllowlist; } catch (_e) {}

  /** Emit `{fam:id}` / `{id}` style token when dataset metadata allows; else ''. */
  function numericTokenFromPart(p){
    if (!p) return '';
    var raw = String((p.idRaw ?? p.id ?? '') || '').trim();
    if (/^\d+\s*:\s*\d+$/.test(raw)){
      var parts = raw.split(':');
      var fam = String(parts[0]).trim();
      var idn = String(parts[1]).trim();
      return `{${fam}:${idn}}`;
    }
    if (/^\d+$/.test(raw)) return `{${raw}}`;
    if (/^\d+\s*:\s*\[[^\]]+\]$/.test(raw)) return `{${raw.replace(/\s+/g, ' ').trim()}}`;
    if (/^\{.*\}$/.test(raw)) return raw;
    var fam2 = p.family != null ? String(p.family) : (p.familyId != null ? String(p.familyId) : '');
    var id2 = p.id != null ? String(p.id) : (p.itemId != null ? String(p.itemId) : '');
    if (/^\d+$/.test(fam2) && /^\d+$/.test(id2)) return `{${fam2}:${id2}}`;
    if (/^\d+$/.test(id2) && !String(fam2).trim()) return `{${id2}}`;
    return '';
  }

  function spawnTokenFromPart(p){
    if (!p) return '';
    const c = normCode(p.code || p.spawnCode || '');
    return c || '';
  }

  /** Default numeric `{fam:id}`; unchecked (spawn mode) uses spawn strings. Mutual fallback when one form is missing. */
  function tokenForPart(p){
    if (!p) return '';
    if (state.idMode){
      const n = numericTokenFromPart(p);
      if (n) return n;
      return spawnTokenFromPart(p);
    }
    const s = spawnTokenFromPart(p);
    if (s) return s;
    return numericTokenFromPart(p);
  }

  function parseIdToken(tok){
    const s = String(tok || '').trim();
    if (!s) return null;

    let m = s.match(/^\{\s*(\d+)\s*\}$/);
    if (m){
      return { kind:'id', id: Number(m[1]) };
    }

    m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m){
      return { kind:'family', family: Number(m[1]), ids: [Number(m[2])] };
    }

    m = s.match(/^\{\s*(\d+)\s*:\s*\[([^\]]+)\]\s*\}$/);
    if (m){
      const ids = String(m[2] || '')
        .match(/\d+/g);
      const list = (ids || []).map(n => Number(n)).filter(n => Number.isFinite(n));
      if (!list.length) return null;
      return { kind:'family', family: Number(m[1]), ids: list };
    }

    return null;
  }

  function normalizeIdTokensForBaseFamily(tokens, baseFamily, opts){
    const src = Array.isArray(tokens) ? tokens : [];
    const out = [];
    const bf = Number(baseFamily);
    const hasBase = Number.isFinite(bf);
    const compactSame = !(opts && opts.compactSameFamily === false);

    let pendingFamily = null;
    let pendingIds = [];

    const flushPending = () => {
      if (!Number.isFinite(pendingFamily) || !pendingIds.length) return;
      if (pendingIds.length === 1){
        out.push(`{${pendingFamily}:${pendingIds[0]}}`);
      } else {
        out.push(`{${pendingFamily}:[${pendingIds.join(' ')}]}`);
      }
      pendingFamily = null;
      pendingIds = [];
    };

    for (const tok of src){
      const parsed = parseIdToken(tok);
      if (!parsed){
        flushPending();
        out.push(tok);
        continue;
      }

      if (parsed.kind === 'id'){
        flushPending();
        if (compactSame && hasBase){
          out.push(`{${parsed.id}}`);
        } else if (hasBase){
          out.push(`{${bf}:${parsed.id}}`);
        } else {
          out.push(`{${parsed.id}}`);
        }
        continue;
      }

      const fam = Number(parsed.family);
      const ids = Array.isArray(parsed.ids) ? parsed.ids.filter(n => Number.isFinite(Number(n))).map(n => Number(n)) : [];
      if (!Number.isFinite(fam) || !ids.length){
        flushPending();
        out.push(tok);
        continue;
      }

      if (hasBase && fam === bf){
        flushPending();
        if (compactSame){
          for (const id of ids) out.push(`{${id}}`);
        } else {
          for (const id of ids) out.push(`{${bf}:${id}}`);
        }
        continue;
      }

      // Foreign-family ids stay family-qualified; merge consecutive same-family tokens.
      if (Number.isFinite(pendingFamily) && pendingFamily === fam){
        pendingIds.push(...ids);
      } else {
        flushPending();
        pendingFamily = fam;
        pendingIds = ids.slice();
      }
    }

    flushPending();
    return out;
  }

  function displayForPart(p){
    if (!p) return '-';

    // Prefer the same labels the main page uses (names + stat summaries) only for Weapon/Character/Class Mod.
    const __allowParentLabels = (state.itemType === 'Weapon');
    const pl = __allowParentLabels ? parentLabelForPart(p) : null;
    let out;
    if (pl){
      if (!state.idMode) out = pl;
      else {
        const id = String(p.idRaw ?? p.id ?? '').trim();
        out = (id && !String(pl).includes(id)) ? `${pl}  (id: ${id})` : pl;
      }
    } else {
      const base = (p.name && String(p.name).trim()) ? String(p.name).trim() : normCode(p.code);
      const id = String(p.idRaw ?? p.id ?? '').trim();
      out = (state.idMode && id) ? `${base}  (id: ${id})` : base;
    }
    if (/pearl/i.test(String(p.stats || '')) && out.indexOf('(Pearl)') === -1) out = out + ' (Pearl)';
    const ef = String(p.effects ?? p.effect ?? '').trim();
    if (ef) out = out + ' — ' + (ef.length > 50 ? ef.slice(0, 49) + '…' : ef);
    return out;
  }

  // Verbose labels for dropdowns: show in-game name, id, spawn code, stats, and effects (red text).
  function dropdownLabelForPart(p){
    if (!p) return '-';
    const rawCode = normCode(p.code);
    let name = (p.name && String(p.name).trim()) ? String(p.name).trim() : rawCode;
    const id = String(p.idRaw ?? p.id ?? '').trim();
    const statsRaw = (p.stats != null) ? String(p.stats) : '';
    const stats = statsRaw.replace(/\s+/g,' ').trim();
    const ef = String(p.effects ?? p.effect ?? '').trim();
    if (ef) name = name + ' — ' + (ef.length > 45 ? ef.slice(0, 44) + '…' : ef);

    const chunks = [];
    if (id) chunks.push(`ID: ${id}`);
    if (rawCode) chunks.push(`Code: ${rawCode}`);
    if (stats) chunks.push(`Stats: ${stats}`);

    return chunks.length ? `${name} - ${chunks.join(' - ')}` : name;
  }

  /** Last segment of spawn path for readable part names in long dropdowns. */
  function spawnSegmentFromNormCode(rawCode){
    const c = String(rawCode || '').replace(/^["']|["']$/g, '').trim();
    if (!c) return '';
    const seg = c.indexOf('.') >= 0 ? c.slice(c.lastIndexOf('.') + 1) : c;
    return String(seg).replace(/^["']|["']$/g, '').trim();
  }

  /** Short list label: spawn part id + dataset name + id + stats (preview has full detail). */
  function dropdownLabelCompactForPart(p){
    if (!p) return '-';
    const rawCode = normCode(p.code);
    const spawnSeg = spawnSegmentFromNormCode(rawCode);
    let datasetName = (p.name && String(p.name).trim()) ? String(p.name).trim() : '';
    const id = String(p.idRaw ?? p.idraw ?? p.id ?? '').trim();
    let stats = (p.stats != null) ? String(p.stats).replace(/\s+/g, ' ').trim() : '';
    if (stats.length > 44) stats = stats.slice(0, 43) + '…';

    const bits = [];
    if (spawnSeg) bits.push(spawnSeg);
    else if (rawCode) bits.push(rawCode.length <= 52 ? rawCode : rawCode.slice(0, 49) + '…');

    if (datasetName) {
      let d = datasetName.length > 56 ? datasetName.slice(0, 55) + '…' : datasetName;
      const spawnLc = (spawnSeg || '').toLowerCase();
      const dLc = d.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sLc = spawnLc.replace(/[^a-z0-9]/g, '');
      if (!spawnSeg || (dLc !== sLc && !dLc.includes(sLc) && d.toLowerCase().indexOf(spawnLc) === -1)) {
        bits.push(d);
      }
    }

    if (/pearl/i.test(String(p.stats || '')) && bits.join(' · ').indexOf('(Pearl)') === -1) bits.push('(Pearl)');
    if (id) {
      const ptypeLo = String(p.partType || '').trim().toLowerCase().replace(/\s+/g, '');
      const idNorm = String(id).replace(/\s+/g, ' ').trim();
      const useBracedId = (ptypeLo === 'element' || ptypeLo === 'status' || ptypeLo === 'typeid1element' || ptypeLo === 'elementswitch')
        && /^\d+\s*:\s*\d+$/.test(idNorm);
      if (useBracedId) {
        const idParts = idNorm.split(':');
        bits.push('{' + String(idParts[0]).trim() + ':' + String(idParts[1]).trim() + '}');
      } else {
        bits.push(id);
      }
    }
    if (stats) bits.push(stats);

    let line = bits.filter(Boolean).join(' · ');
    if (line.length > 150) line = line.slice(0, 147) + '…';
    return line || rawCode || '-';
  }

  function barrelFamilyDropdownLabelCompact(p){
    if (!p) return '-';
    const base = dropdownLabelCompactForPart(p);
    const ef = String(p.effects ?? p.effect ?? p.effects_text ?? '').trim();
    if (!ef) return base;
    const split = splitEffectPerkBodyForPreview(ef);
    let extra = '';
    if (split.perk && split.body) {
      extra = split.perk + ': ' + (split.body.length > 72 ? split.body.slice(0, 71) + '…' : split.body);
    } else if (split.body) {
      extra = split.body.length > 96 ? split.body.slice(0, 95) + '…' : split.body;
    } else {
      extra = split.perk;
    }
    if (!extra) return base;
    let out = base + ' · ' + extra;
    if (out.length > 220) out = out.slice(0, 217) + '…';
    return out;
  }

  function barrelFamilyOptionTitle(p){
    let base = '';
    try{
      if (typeof window.partTooltipText === 'function') base = String(window.partTooltipText(p) || '').trim();
    }catch(_){}
    const ef = String(p.effects ?? p.effect ?? p.effects_text ?? '').trim();
    if (ef && !base.includes(ef)) return base ? (base + ' | ' + ef) : ef;
    return base;
  }

  // ---- Parent dropdown label bridge (re-uses the same part lists/labels as the main page) ----
  const __PARENT_LABEL_CACHE = new Map();
  let __PARENT_LABEL_CACHE_AT = 0;

  function __normKey(s){
    if (s == null) return '';
    return String(s).trim();
  }

  function __cacheKeyVariants(raw){
    const out = [];
    const s = __normKey(raw);
    if (!s) return out;
    out.push(s);

    // Strip surrounding quotes
    if (s.startsWith('"') && s.endsWith('"') && s.length > 1) out.push(s.slice(1,-1));

    // Strip braces
    const unbraced = s.replace(/^\{\s*/, '').replace(/\s*\}$/, '');
    if (unbraced !== s){
      out.push(unbraced);
      out.push(`{${unbraced}}`);
    }

    return Array.from(new Set(out));
  }

  function rebuildParentLabelCache(){
    __PARENT_LABEL_CACHE.clear();
    __PARENT_LABEL_CACHE_AT = Date.now();

    try{
      const pd = (window.parent && window.parent.document) ? window.parent.document : null;
      if (!pd) return;

      const selects = pd.querySelectorAll('select');
      for (const sel of Array.from(selects)){
        for (const opt of Array.from(sel.options || [])){
          const v = __normKey(opt.value);
          const t = __normKey(opt.textContent);
          if (!v || !t) continue;

          for (const k of __cacheKeyVariants(v)){
            if (!__PARENT_LABEL_CACHE.has(k)) __PARENT_LABEL_CACHE.set(k, t);
          }

          // Also index labels by ids embedded in the text: "(id: X)".
          const m = t.match(/\(id:\s*([^\)]+)\)/i);
          if (m && m[1]){
            const id = __normKey(m[1]);
            for (const k of __cacheKeyVariants(id)){
              if (!__PARENT_LABEL_CACHE.has(k)) __PARENT_LABEL_CACHE.set(k, t);
            }
          }
        }
      }
    }catch(_e){}
  }

  function parentLabelForPart(p){
    try{
      if (state && state.itemType === 'Class Mod') return '';
      // Refresh occasionally in case the parent dropdowns were re-populated.
      if (!__PARENT_LABEL_CACHE.size || (Date.now() - __PARENT_LABEL_CACHE_AT) > 1500){
        rebuildParentLabelCache();
      }

      const keys = [];

      const id = __normKey(p.idRaw ?? p.id ?? '');
      if (id) keys.push(...__cacheKeyVariants(id));

      const codeRaw = __normKey(p.code ?? '');
      if (codeRaw) keys.push(...__cacheKeyVariants(codeRaw));
      const code = __normKey(normCode(codeRaw));
      if (code && code !== codeRaw) keys.push(...__cacheKeyVariants(code));

      for (const k of keys){
        if (__PARENT_LABEL_CACHE.has(k)) return __PARENT_LABEL_CACHE.get(k);
      }
    }catch(_e){}
    return '';
  }

  // Keep cache warm after load
  try{ setTimeout(rebuildParentLabelCache, 250); }catch(_e){}
function getAllParts(){
    return (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) ? window.STX_DATASET.ALL_PARTS : [];
  }

  function unique(list){
    return Array.from(new Set(list.filter(Boolean)));
  }

  function isAllPartsEnabled(){
    return !!(state && state.allParts);
  }

  function rarityTierFromItemTypeString(s, rowHint){
    const row = (s && typeof s === 'object') ? s : rowHint;
    const raw = (s && typeof s === 'object')
      ? (s.itemTypeString || s.code || s.itemType || '')
      : s;
    const t = String(raw || '').toLowerCase();
    const item = Number(row && ((row.itemId != null) ? row.itemId : row.id));
    if (Number.isFinite(item) && item >= 51 && item <= 60) return 5;
    if (t.includes('part_pearl')) return 5;
    if (t.includes('pearl_') || t.includes('pearlescent') || /(?:^|[._])comp_06_pearlescent/.test(t)) return 5;
    if (t.includes('comp_01_common')) return 0;
    if (t.includes('comp_02_uncommon')) return 1;
    if (t.includes('comp_03_rare')) return 2;
    if (t.includes('comp_04_epic')) return 3;
    if (t.includes('comp_05_legendary')) return 4;
    return null;
  }

  function rarityTierLabel(t){
    switch (Number(t)){
      case 0: return 'Common';
      case 1: return 'Uncommon';
      case 2: return 'Rare';
      case 3: return 'Epic';
      case 4: return 'Legendary';
      case 5: return 'Pearlescent';
      default: return 'Unknown';
    }
  }

  function rarityTierFromValue(v){
    const s = String(v || '').trim().toLowerCase();
    if (!s) return null;
    if (/^\d+$/.test(s)){
      const n = Number(s);
      return (n >= 0 && n <= 5) ? n : null;
    }
    if (s === 'common') return 0;
    if (s === 'uncommon') return 1;
    if (s === 'rare') return 2;
    if (s === 'epic') return 3;
    if (s === 'legendary') return 4;
    if (s === 'pearlescent' || s === 'pearl') return 5;
    return null;
  }

  function parseRarityValue(v){
    const s = String(v || '').trim();
    if (!s) return null;

    // Preferred tier-only values used by STX/simple rarity dropdown.
    const tier = rarityTierFromValue(s);
    if (Number.isFinite(tier)) return { tier };

    // Backward compatibility for old "family|item" values.
    if (s.indexOf('|') !== -1){
      const [a,b] = s.split('|');
      const familyId = Number(String(a || '').trim());
      const itemId = Number(String(b || '').trim());
      if (!Number.isFinite(familyId) || !Number.isFinite(itemId)) return null;
      const row = (Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [])
        .find(r => Number(r && r.familyId) === familyId && Number(r && r.itemId) === itemId);
      const rt = row ? rarityTierFromItemTypeString(row.itemTypeString, row) : null;
      return { tier: Number.isFinite(rt) ? rt : null, familyId, itemId };
    }
    return null;
  }

  function getSelectedRarityTier(){
    const parsed = parseRarityValue(
      (state && state.rarity) || (($('rarity') && $('rarity').value) ? $('rarity').value : '')
    );
    return (parsed && Number.isFinite(parsed.tier)) ? Number(parsed.tier) : null;
  }

  function categoryUsesRarityTierFilter(category){
    const c = String(category || '').trim().toLowerCase();
    return c === 'class mod' || c === 'classmod' || c === 'character' || c === 'enhancement';
  }

  function rarityTierFilterActiveForCurrentContext(){
    const catUi = String(
      (state && state.itemType) ||
      (($('itemType') && $('itemType').value) ? $('itemType').value : '')
    ).trim();
    const cat = (catUi === 'Heavy') ? 'Weapon' : catUi;
    return categoryUsesRarityTierFilter(cat);
  }

  function refreshRarityUiState(){
    const sel = $('rarity');
    if (!sel) return;
    const active = rarityTierFilterActiveForCurrentContext();
    /* Hide only the rarity tier control, not sibling item level (#stxRarityTierWrap on index; else parent of #rarity e.g. embed column). */
    const rarityWrap = document.getElementById('stxRarityTierWrap') || sel.parentElement || null;
    const rarityLabel = document.querySelector('label[for="rarity"]');
    if (rarityLabel){
      rarityLabel.textContent = active ? 'Rarity Filter' : 'Rarity (auto from rarity ID)';
    }
    if (rarityWrap){
      rarityWrap.style.display = active ? '' : 'none';
    }
    sel.disabled = !active;
  }

  function getGuidedContext(){
    const gi = document.getElementById('ccGuidedItemType');
    const gm = document.getElementById('ccGuidedManufacturer');
    const gw = document.getElementById('ccGuidedWeaponType');
    const gl = document.getElementById('ccGuidedLevel');
    const getVal = (el)=>{
      if (!el || el.tagName !== 'SELECT') return (el && el.value || '').trim();
      return (el.value || '').trim() || (el.options[el.selectedIndex] && (el.options[el.selectedIndex].value || '').trim()) || '';
    };
    const itemType = getVal(gi);
    if (!itemType) return null;
    return {
      itemType,
      manufacturer: getVal(gm),
      weaponType: getVal(gw),
      level: Number(gl && gl.value || 60) || 60
    };
  }

  /** Guided-dropdown art (same paths as cc-guided-builder-rebuild.js). */
  const STX_CC_WEAPON_TYPE_DIR = './assets/img/guided-dropdowns/weapon-type/';
  const STX_CC_LEGENDARY_AUG_BASE = './assets/img/guided-dropdowns/legendary-augments/';
  const STX_CC_PEARL_ITEMTYPE_BASE = './assets/img/guided-dropdowns/pearl-item-types/';
  const STX_CC_ELEMENT_ICON_BASE = './assets/img/elements/';
  const STX_WEAPON_TYPE_ICON_FILES = {
    'assault rifle': 'ico_ui_art_assault_small.png',
    pistol: 'ico_ui_art_pistol_small.png',
    shotgun: 'ico_ui_art_shotgun_small.png',
    smg: 'ico_ui_art_smg_small.png',
    'sniper rifle': 'ico_ui_art_sniper_small.png',
    sniper: 'ico_ui_art_sniper_small.png',
    'heavy weapon': 'ico_ui_art_heavy_small.png',
    heavy: 'ico_ui_art_heavy_small.png'
  };
  const STX_COMP_TIER_FILTERS = [
    'grayscale(0.5) brightness(0.85)',
    'sepia(0.45) saturate(1.7) hue-rotate(48deg) brightness(0.9)',
    'sepia(0.32) saturate(2.1) hue-rotate(195deg) brightness(0.94)',
    'sepia(0.38) saturate(2.6) hue-rotate(268deg) brightness(1.0)'
  ];

  const STX_GUIDED_DROPDOWN_BASE = './assets/img/guided-dropdowns/';
  /** Simple Builder top row: same art as Guided / index.html static options. */
  const STX_ITEM_TYPE_ICONS = {
    Weapon: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_gun_assault.png',
    'Heavy Weapon': STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_heavy.png',
    Shield: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_shield.png',
    Repkit: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_repkit.png',
    Grenade: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_grenade.png',
    Gadget: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_heavy.png',
    Enhancement: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_classmod.png',
    'Class Mod': STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_classmod.png',
    Other: STX_CC_LEGENDARY_AUG_BASE + 'ico_legendary_aug_gun_assault.png'
  };

  function stxItemTypeIconUrl(cat){
    const c = String(cat || '').trim();
    if (!c) return '';
    if (STX_ITEM_TYPE_ICONS[c]) return STX_ITEM_TYPE_ICONS[c];
    const low = c.toLowerCase().replace(/\s+/g, ' ');
    if (low === 'character' || low === 'classmod' || low === 'class mod') return STX_ITEM_TYPE_ICONS['Class Mod'];
    if (low === 'heavy') return STX_ITEM_TYPE_ICONS['Heavy Weapon'];
    return '';
  }

  function stxManufacturerIconUrl(rawMfr, itemTypeCat){
    const it = String(itemTypeCat || '').trim();
    if (/class\s*mod/i.test(it)){
      const m = String(rawMfr || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const base = './assets/img/vault-hunters/';
      if (m === 'siren') return base + 'player_class_dark_siren.png';
      if (m === 'paladin') return base + 'player_class_paladin.png';
      if (m === 'exo soldier' || m === 'exosoldier') return base + 'player_class_exo_soldier.png';
      if (m === 'gravitar') return base + 'player_class_gravitar.png';
      if (m === 'robodealer' || m === 'c4sh') return base + 'player_robodealer.png';
      return '';
    }
    const m = String(rawMfr || '').trim().toLowerCase();
    const map = {
      atlas: 'manufacturer/ui_art_manu_logomark_atlas_small.png',
      cov: 'manufacturer/ui_art_manu_logomark_cov_small.png',
      daedalus: 'manufacturer/ui_art_manu_logomark_daedalus_small.png',
      hyperion: 'manufacturer/ui_art_manu_logomark_hyperion_small.png',
      jakobs: 'manufacturer/ui_art_manu_logomark_jakobs_small.png',
      maliwan: 'manufacturer/ui_art_manu_logomark_maliwan_small.png',
      order: 'manufacturer/ui_art_manu_logomark_order_small.png',
      ripper: 'manufacturer/ui_art_manu_logomark_ripper_small.png',
      tediore: 'manufacturer/ui_art_manu_logomark_tediore_small.png',
      torgue: 'manufacturer/ui_art_manu_logomark_torgue_small.png',
      vladof: 'manufacturer/ui_art_manu_logomark_vladof_small.png',
      borg: 'manufacturer/ui_art_manu_logomark_ripper_small.png'
    };
    const rel = map[m];
    return rel ? STX_GUIDED_DROPDOWN_BASE + rel : '';
  }

  function stxSyncCustomSelectIfWrapped(sel){
    if (!sel || typeof sel.__customSelectSync !== 'function') return;
    try { sel.__customSelectSync(); } catch (_) {}
  }

  function stxNormWeaponKeyFromUi(wtRaw){
    let wt = String(wtRaw || '').trim().toLowerCase();
    if (wt === 'submachine gun') wt = 'smg';
    if (wt === 'heavy') wt = 'heavy weapon';
    if (wt === 'sniper') wt = 'sniper rifle';
    return wt;
  }

  function stxWeaponTypeIconUrl(wtRaw){
    const k = stxNormWeaponKeyFromUi(wtRaw);
    const fn = STX_WEAPON_TYPE_ICON_FILES[k];
    return fn ? STX_CC_WEAPON_TYPE_DIR + fn : '';
  }

  /** Match cc-guided-builder `ccNormalizedWeaponTypeKey` so barrel icons align with Guided. */
  function stxNormalizedWeaponTypeKeyFromPart(p){
    if (!p) return '';
    let wt = String(p.weaponType || p.itemType || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (wt === 'submachine gun') wt = 'smg';
    if (STX_WEAPON_TYPE_ICON_FILES[wt]) return wt;

    const c = String(normCode(p.code || p.spawnCode || p.importCode || '') || '').toUpperCase();
    if (!c) return '';
    if (/_HW\.|\bMAL_HW\b|\bTOR_HW\b|\bBOR_HW\b|\bVLA_HW\b|\bJAK_HW\b|\bTED_HW\b/i.test(c)) return 'heavy weapon';
    if (/_AR\.|\bDAD_AR\b|\bJAK_AR\b|\bATL_AR\b|\bVLA_AR\b|\bMAL_AR\b|\bTED_AR\b|\bHYP_AR\b/i.test(c)) return 'assault rifle';
    if (/_SM\.|\bDAD_SM\b|\bJAK_SM\b|\bMAL_SM\b|\bVLA_SM\b|\bTED_SM\b|\bHYP_SM\b/i.test(c)) return 'smg';
    if (/_SG\.|\bDAD_SG\b|\bJAK_SG\b|\bMAL_SG\b|\bVLA_SG\b|\bTED_SG\b|\bHYP_SG\b/i.test(c)) return 'shotgun';
    if (/_PS\.|\bDAD_PS\b|\bJAK_PS\b|\bMAL_PS\b|\bVLA_PS\b|\bTED_PS\b|\bHYP_PS\b/i.test(c)) return 'pistol';
    if (/_SR\.|\bDAD_SR\b|\bJAK_SR\b|\bMAL_SR\b|\bVLA_SR\b|\bTED_SR\b|\bHYP_SR\b/i.test(c)) return 'sniper rifle';
    return '';
  }

  function stxSpawnCodeLooksLikeWeaponFamily(p){
    if (!p) return false;
    const c = normCode(p.code || p.spawnCode || p.importCode || '').toLowerCase();
    return /\.(ar|ps|sg|sm|sr|hw)\./.test(c);
  }

  function stxWeaponFamilyPearlFilename(p){
    let kw = stxNormalizedWeaponTypeKeyFromPart(p);
    if (kw === 'submachine gun') kw = 'smg';
    const map = {
      'assault rifle': 'ico_pearl_aug_gun_assault.png',
      pistol: 'ico_pearl_aug_gun_pistol.png',
      shotgun: 'ico_pearl_aug_gun_shotgun.png',
      smg: 'ico_pearl_aug_gun_smg.png',
      'sniper rifle': 'ico_pearl_aug_gun_sniper.png',
      sniper: 'ico_pearl_aug_gun_sniper.png',
      'heavy weapon': 'ico_pearl_aug_gun_heavy.png',
      heavy: 'ico_pearl_aug_gun_heavy.png'
    };
    return map[kw] || 'ico_pearl_aug_gun_assault.png';
  }

  function stxPartLooksLegendaryBarrel(p){
    if (!p) return false;
    if (String(p.legendaryName || '').trim()) return true;
    if (/legendary/i.test(String(p.partType || ''))) return true;
    const c = String(normCode(p.code || p.spawnCode || p.importCode || '') || '').toLowerCase();
    return c.indexOf('comp_05_legendary') !== -1;
  }

  function stxLegendaryAugFilenameFromWeaponKey(key){
    const wt = stxNormWeaponKeyFromUi(key);
    const map = {
      'assault rifle': 'ico_legendary_aug_gun_assault.png',
      pistol: 'ico_legendary_aug_gun_pistol.png',
      shotgun: 'ico_legendary_aug_gun_shotgun.png',
      smg: 'ico_legendary_aug_gun_smg.png',
      'sniper rifle': 'ico_legendary_aug_gun_sniper.png',
      sniper: 'ico_legendary_aug_gun_sniper.png',
      'heavy weapon': 'ico_legendary_aug_heavy.png',
      heavy: 'ico_legendary_aug_heavy.png'
    };
    return map[wt] || map['assault rifle'] || '';
  }

  /** Full URL for pearl slot art from part category + spawn code (like ccPearlSlotAugFullUrl). */
  function stxPearlAugFullUrlFromPart(p){
    if (!p) return '';
    if (stxSpawnCodeLooksLikeWeaponFamily(p)) {
      return STX_CC_PEARL_ITEMTYPE_BASE + stxWeaponFamilyPearlFilename(p);
    }
    let cat = String(p.category || '').trim().toLowerCase();
    if (cat === 'character') cat = 'class mod';
    let fn = '';
    if (cat === 'class mod') fn = 'ico_pearl_aug_gun_classmod.png';
    else if (cat === 'grenade') fn = 'ico_pearl_aug_gun_grenade.png';
    else if (cat === 'repkit') fn = 'ico_pearl_aug_gun_repkit.png';
    else if (cat === 'shield') fn = 'ico_pearl_aug_gun_shield.png';
    else if (cat === 'heavy weapon' || cat === 'gadget'){
      fn = 'ico_pearl_aug_gun_heavy.png';
    } else if (cat === 'weapon'){
      fn = stxWeaponFamilyPearlFilename(p);
      if (fn === 'ico_pearl_aug_gun_assault.png' && !stxNormalizedWeaponTypeKeyFromPart(p)) fn = '';
    }
    return fn ? STX_CC_PEARL_ITEMTYPE_BASE + fn : '';
  }

  function stxCompIconContext(){
    const guided = getGuidedContext();
    if (guided && guided.itemType){
      const catUi = guided.itemType;
      const cat = (catUi === 'Heavy') ? 'Weapon' : catUi;
      let wtr = (cat === 'Weapon' && catUi === 'Heavy') ? 'Heavy Weapon' : (guided.weaponType || (cat === 'Weapon' ? 'Assault Rifle' : ''));
      if (String(wtr) === 'Heavy') wtr = 'Heavy Weapon';
      return { cat, catUi, weaponType: String(wtr || '') };
    }
    const catUi = state.itemType || '';
    const cat = (catUi === 'Heavy') ? 'Weapon' : catUi;
    let wtr = (cat === 'Weapon' && catUi === 'Heavy') ? 'Heavy Weapon' : (($('weaponType') && $('weaponType').value) || state.weaponType || '');
    if (String(wtr) === 'Heavy') wtr = 'Heavy Weapon';
    return { cat, catUi, weaponType: String(wtr || '') };
  }

  function stxResolveGearCategoryForCompIcons(ctx){
    let cat = String(ctx && ctx.cat || '').trim().toLowerCase();
    if (cat === 'enhancement' && state.mainPart){
      const mc = String(state.mainPart.category || state.detectedCategory || '').trim().toLowerCase();
      if (mc === 'weapon') cat = 'weapon';
      else if (mc === 'shield') cat = 'shield';
      else if (mc === 'grenade') cat = 'grenade';
      else if (mc === 'repkit') cat = 'repkit';
      else if (mc === 'character' || mc === 'class mod') cat = 'class mod';
      else if (mc === 'gadget' || mc === 'heavy weapon') cat = 'gadget';
    }
    return cat;
  }

  function stxPearlSlotIconFilenameFromContext(ctx){
    if (!ctx) return '';
    let cat = stxResolveGearCategoryForCompIcons(ctx);
    if (cat === 'character') cat = 'class mod';
    const wt = stxNormWeaponKeyFromUi(ctx.weaponType);
    if (cat === 'class mod' || cat === 'classmod') return 'ico_pearl_aug_gun_classmod.png';
    if (cat === 'grenade') return 'ico_pearl_aug_gun_grenade.png';
    if (cat === 'repkit') return 'ico_pearl_aug_gun_repkit.png';
    if (cat === 'shield') return 'ico_pearl_aug_gun_shield.png';
    if (cat === 'heavy weapon' || cat === 'gadget') return 'ico_pearl_aug_gun_heavy.png';
    if (cat === 'weapon'){
      const map = {
        'assault rifle': 'ico_pearl_aug_gun_assault.png',
        pistol: 'ico_pearl_aug_gun_pistol.png',
        shotgun: 'ico_pearl_aug_gun_shotgun.png',
        smg: 'ico_pearl_aug_gun_smg.png',
        'sniper rifle': 'ico_pearl_aug_gun_sniper.png',
        sniper: 'ico_pearl_aug_gun_sniper.png',
        'heavy weapon': 'ico_pearl_aug_gun_heavy.png',
        heavy: 'ico_pearl_aug_gun_heavy.png'
      };
      return map[wt] || map['assault rifle'];
    }
    return '';
  }

  /** Legendary aug file by resolved UI gear category + weapon class (rarity comp tier + slots). */
  function stxLegendaryAugFilenameFromCategoryWeapon(catRaw, weaponTypeStr, normWeaponKey, partHint){
    if (partHint && stxSpawnCodeLooksLikeWeaponFamily(partHint)) {
      const wk = normWeaponKey || stxNormalizedWeaponTypeKeyFromPart(partHint);
      return stxLegendaryAugFilenameFromWeaponKey(wk || weaponTypeStr || 'Assault Rifle');
    }
    const c0 = String(catRaw || '').trim().toLowerCase();
    const c = (c0 === 'character' || c0 === 'classmod') ? 'class mod' : c0;
    const byCat = {
      shield: 'ico_legendary_aug_shield.png',
      repkit: 'ico_legendary_aug_repkit.png',
      grenade: 'ico_legendary_aug_grenade.png',
      'class mod': 'ico_legendary_aug_classmod.png'
    };
    if (byCat[c]) return byCat[c];
    const wk = normWeaponKey || stxNormalizedWeaponTypeKeyFromPart({ weaponType: weaponTypeStr, itemType: weaponTypeStr });
    return stxLegendaryAugFilenameFromWeaponKey(wk || weaponTypeStr || 'Assault Rifle');
  }

  function stxGuessPearlElementIconFilename(p){
    const its = String(p && p.itemTypeString || '').toLowerCase();
    const code = String(p && p.code || '').toLowerCase();
    const nm = String((p && (p.legendaryName || p.name)) || '').toLowerCase();
    const blob = its + ' ' + code + ' ' + nm;
    if (/\bpearl_(damage|reload|firerate|handling)\b/.test(blob)) return 'ico_misc_pearl.png';
    const pe = its.match(/\bpearl_(normal|shock|radiation|corrosive|cryo|fire)\b/);
    if (pe) return pe[1] === 'normal' ? 'pearl_elemental_kinetic.png' : 'pearl_elemental_' + pe[1] + '.png';
    if (blob.includes('corrosive')) return 'pearl_elemental_corrosive.png';
    if (blob.includes('cryo')) return 'pearl_elemental_cryo.png';
    if (blob.includes('radiation') || blob.includes('_rad_')) return 'pearl_elemental_radiation.png';
    if (blob.includes('shock')) return 'pearl_elemental_shock.png';
    if (blob.includes('kinetic')) return 'pearl_elemental_kinetic.png';
    if (blob.includes('incendiary') || /\bfire\b/.test(blob)) return 'pearl_elemental_fire.png';
    return '';
  }

  /** True only for rarity *component* rows (comp_01…comp_06 / pearl ids), not every partType:Rarity barrel/etc. */
  function isStxCompRarityComponentPart(p){
    if (!p) return false;
    const code = String(p.code || '').toLowerCase();
    const its = String(p.itemTypeString || '').toLowerCase();
    const blob = its + ' ' + code;
    const item = Number((p.itemId != null) ? p.itemId : p.id);
    if (Number.isFinite(item) && item >= 51 && item <= 60) return true;
    if (/(^|[._])(comp_0[1-6]_|pearl_)/.test(code)) return true;
    if (/\bpearl_[a-z0-9]+\b/.test(its)) return true;
    if (code.includes('.comp_') || code.includes('enhancement.comp_')) return true;
    if (/(?:^|[._])comp_06_pearlescent/.test(code) || /(?:^|[._])comp_06_pearlescent/.test(its)) return true;
    if (/\bcomp_0[1-6]_/.test(blob) || /\bpearl_/.test(blob)) return true;
    return false;
  }

  /** Rarity ID dropdown (#mainPart): comp rows + any remaining dataset row tagged partType Rarity. */
  function isStxRarityIdCompIconPart(p){
    if (!p) return false;
    if (isStxCompRarityComponentPart(p)) return true;
    return String(p.partType || '').trim().toLowerCase() === 'rarity';
  }

  function stxCodeBlobForCompTier(p){
    if (!p) return '';
    const its = String(p.itemTypeString || '').toLowerCase();
    const c = normCode(p.code).toLowerCase();
    const sp = normCode(p.spawnCode).toLowerCase();
    const nm = String((p.legendaryName || p.name || '')).toLowerCase();
    return `${its} ${c} ${sp} ${nm}`;
  }

  function stxCompTierFromCodeBlob(blob){
    const t = String(blob || '').toLowerCase();
    const m = t.match(/comp_0([1-6])_/);
    if (!m) return null;
    const n = Number(m[1]);
    if (n >= 1 && n <= 6) return n - 1;
    return null;
  }

  function stxInferCompTier(p){
    if (!p) return null;
    let t = rarityTierFromItemTypeString(p.itemTypeString, p);
    if (Number.isFinite(t)) return t;
    const blob = stxCodeBlobForCompTier(p);
    t = rarityTierFromItemTypeString(blob, p);
    if (Number.isFinite(t)) return t;
    t = stxCompTierFromCodeBlob(blob);
    if (Number.isFinite(t)) return t;
    if (isStxRarityIdCompIconPart(p)){
      const ui = getSelectedRarityTier();
      if (Number.isFinite(ui)) return ui;
    }
    return null;
  }

  function stxApplyCompPartOptionDecoration(opt, p){
    if (!opt || !p || !isStxRarityIdCompIconPart(p)) return;
    const tier = stxInferCompTier(p);
    if (!Number.isFinite(tier)) return;

    opt.removeAttribute('data-cc-icon');
    opt.removeAttribute('data-cc-icon-filter');

    const ctx = stxCompIconContext();
    const wtFallback = ctx.weaponType || 'Assault Rifle';

    if (tier === 5){
      if (!stxPartMatchesPearlRarityIdAllowlist(p)) {
        const catLow = stxResolveGearCategoryForCompIcons(ctx);
        const legFn = stxLegendaryAugFilenameFromCategoryWeapon(catLow, ctx.weaponType || wtFallback, stxNormalizedWeaponTypeKeyFromPart(p), p);
        if (legFn) opt.setAttribute('data-cc-icon', STX_CC_LEGENDARY_AUG_BASE + legFn);
        return;
      }
      const elFn = stxGuessPearlElementIconFilename(p);
      if (elFn){
        const base = (elFn === 'ico_misc_pearl.png') ? STX_CC_PEARL_ITEMTYPE_BASE : STX_CC_ELEMENT_ICON_BASE;
        opt.setAttribute('data-cc-icon', base + elFn);
        return;
      }
      const pfn = stxPearlSlotIconFilenameFromContext(ctx);
      if (pfn){
        opt.setAttribute('data-cc-icon', STX_CC_PEARL_ITEMTYPE_BASE + pfn);
        return;
      }
      opt.setAttribute('data-cc-icon', STX_CC_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
      return;
    }

    if (tier === 4){
      const catLow = stxResolveGearCategoryForCompIcons(ctx);
      const legFn = stxLegendaryAugFilenameFromCategoryWeapon(catLow, ctx.weaponType || wtFallback, stxNormalizedWeaponTypeKeyFromPart(p), p);
      if (legFn){
        opt.setAttribute('data-cc-icon', STX_CC_LEGENDARY_AUG_BASE + legFn);
        return;
      }
      return;
    }

    if (tier >= 0 && tier <= 3){
      const flt = STX_COMP_TIER_FILTERS[tier] || '';
      const catLow = stxResolveGearCategoryForCompIcons(ctx);
      if (catLow === 'weapon' || catLow === 'heavy weapon' || catLow === 'heavy'){
        const wurl = stxWeaponTypeIconUrl(wtFallback);
        if (wurl){
          opt.setAttribute('data-cc-icon', wurl);
          if (flt) opt.setAttribute('data-cc-icon-filter', flt);
        }
        return;
      }
      const pfn = stxPearlSlotIconFilenameFromContext(ctx);
      if (pfn){
        opt.setAttribute('data-cc-icon', STX_CC_PEARL_ITEMTYPE_BASE + pfn);
        if (flt) opt.setAttribute('data-cc-icon-filter', flt);
        return;
      }
      const wurl = stxWeaponTypeIconUrl(wtFallback);
      if (wurl){
        opt.setAttribute('data-cc-icon', wurl);
        if (flt) opt.setAttribute('data-cc-icon-filter', flt);
      }
    }
  }

  /** Main barrel + body slots (not barrel accessory): pearl / legendary aug / weapon-type chip. */
  function isStxBodyBarrelPearlLegendIconSlot(schemaItem, category){
    if (!schemaItem) return false;
    const k = schemaItem.key;
    const cat = String(category || '').trim();
    if (k === 'barrel') return cat === 'Weapon' || cat === 'Gadget';
    if (k === 'body' || k === 'bodyAcc') return cat === 'Weapon' || cat === 'Gadget' || cat === 'Shield';
    return false;
  }

  function stxApplySlotPartOptionDecoration(opt, p, schemaItem, category){
    if (!opt || !p || !schemaItem) return;
    if (!isStxBodyBarrelPearlLegendIconSlot(schemaItem, category)) return;
    opt.removeAttribute('data-cc-icon');
    opt.removeAttribute('data-cc-icon-filter');
    const its = String(p.itemTypeString || '').toLowerCase();
    const code = String(p.code || '').toLowerCase();
    const nm = String((p.legendaryName || p.name || '')).toLowerCase();
    const blob = its + ' ' + code + ' ' + nm;

    if (stxPartMatchesPearlRarityIdAllowlist(p)){
      const elFn = stxGuessPearlElementIconFilename(p);
      if (elFn){
        opt.setAttribute('data-cc-icon', STX_CC_ELEMENT_ICON_BASE + elFn);
        return;
      }
      const pearlUrl = stxPearlAugFullUrlFromPart(p);
      if (pearlUrl){
        opt.setAttribute('data-cc-icon', pearlUrl);
        return;
      }
      opt.setAttribute('data-cc-icon', STX_CC_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
      return;
    }

    // Legendary body/barrel rows: `legendary_augments` art.
    const looksLegendary =
      stxPartLooksLegendaryBarrel(p) ||
      /comp_05_legendary/.test(blob) ||
      nm.indexOf('legendary') !== -1;

    if (looksLegendary){
      const catPart = String(p.category || '').trim().toLowerCase();
      const legFn = stxLegendaryAugFilenameFromCategoryWeapon(
        catPart,
        p.weaponType || p.itemType,
        stxNormalizedWeaponTypeKeyFromPart(p),
        p
      );
      if (legFn){
        opt.setAttribute('data-cc-icon', STX_CC_LEGENDARY_AUG_BASE + legFn);
        return;
      }
      const ctx = stxCompIconContext();
      const legFn2 = stxLegendaryAugFilenameFromCategoryWeapon(
        stxResolveGearCategoryForCompIcons(ctx),
        ctx.weaponType || 'Assault Rifle',
        ''
      );
      if (legFn2) opt.setAttribute('data-cc-icon', STX_CC_LEGENDARY_AUG_BASE + legFn2);
      return;
    }

    // Default: weapon-type chip (no rarity tint).
    const k2 = stxNormalizedWeaponTypeKeyFromPart(p);
    if (k2){
      const fn2 = STX_WEAPON_TYPE_ICON_FILES[k2];
      if (fn2) opt.setAttribute('data-cc-icon', STX_CC_WEAPON_TYPE_DIR + fn2);
    }
  }

  function getRarityRowsForCurrentContext(){
    const table = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
    const guided = getGuidedContext();
    const useGuided = guided && guided.itemType;
    const man = useGuided ? guided.manufacturer : (($('manufacturer') && $('manufacturer').value) || state.manufacturer || '');
    if (!useGuided) state.manufacturer = man;
    const allMansEl = useGuided ? document.getElementById('ccGuidedAllManufacturers') : null;
    const useAllMfr = useGuided ? !!(allMansEl && allMansEl.checked) : isAllPartsEnabled();
    const catUi = useGuided ? guided.itemType : (state.itemType || '');
    const cat   = (catUi === 'Heavy') ? 'Weapon' : catUi;

    const wtypeRaw = useGuided
      ? ((cat === 'Weapon' && catUi === 'Heavy') ? 'Heavy Weapon' : (guided.weaponType || (cat === 'Weapon' ? 'Assault Rifle' : '')))
      : ((cat === 'Weapon' && catUi === 'Heavy') ? 'Heavy Weapon' :
      ((cat === 'Weapon' && $('weaponType')) ? ($('weaponType').value || state.weaponType || '') : (state.weaponType || '')));

    const wtypeNorm = (String(wtypeRaw) === 'Heavy') ? 'Heavy Weapon' : String(wtypeRaw || '');
    if (cat === 'Weapon' && !useGuided) state.weaponType = wtypeNorm;

    const itemType = (cat === 'Weapon') ? wtypeNorm : cat;
    let wantType = String(itemType || '').trim();
    if (cat === 'Weapon' && !wantType) {
      if (guided && guided.itemType) wantType = 'Assault Rifle';
    }
    const manL = String(man || '').trim().toLowerCase();
    const itemTypeMatches = (rowTypeRaw)=>{
      const rt = String(rowTypeRaw || '').trim();
      if (!rt || !wantType) return false;
      if (wantType === 'Heavy Weapon'){
        return (rt === 'Heavy Weapon' || rt === 'Heavy' || rt === 'HeavyWeapon');
      }
      return rt === wantType;
    };

    const isPearlRow = (r)=>{
      const item = Number(r && ((r.itemId != null) ? r.itemId : r.id));
      const code = String((r && (r.itemTypeString || r.code)) || '').toLowerCase();
      if (Number.isFinite(item) && item >= 51 && item <= 60) return true;
      return code.includes('pearl_') || /(?:^|[._])comp_06_pearlescent/.test(code);
    };

    let rows = table.filter(r => {
      if (cat === 'Weapon' && isPearlRow(r)) return true;
      if (!itemTypeMatches(r && r.itemType)) return false;
      if (useAllMfr) return true;
      return String(r && r.manufacturer || '').trim().toLowerCase() === manL;
    });

    // Non-weapon gear fallback when manufacturer-specific rows are missing.
    if (!rows.length && !useAllMfr && cat !== 'Weapon'){
      rows = table.filter(r => itemTypeMatches(r && r.itemType));
    }

    // Older rarity tables may not include pearlescent rows yet.
    // Keep pearlescent tier usable by injecting a stable fallback set.
    if (cat === 'Weapon'){
      const hasPearlRows = rows.some(isPearlRow);
      if (!hasPearlRows){
        const synthMan = String(man || '').trim();
        const synthType = String(wantType || 'Weapon').trim();
        const synth = PEARL_FALLBACK_ROWS.map(pr => ({
          manufacturer: synthMan,
          itemType: synthType,
          itemTypeString: pr.itemTypeString,
          familyId: 1,
          itemId: Number(pr.itemId),
          legendaryName: String(pr.legendaryName || ''),
          source: 'stx-simple-fallback'
        }));
        rows = rows.concat(synth);
      }
    }
    return rows;
  }

  function computeGuidedPrefix(){
    const guided = getGuidedContext();
    if (!guided || !guided.itemType) return '';
    const rows = getRarityRowsForCurrentContext();
    const pick = rows.find(r => !String(r && r.legendaryName || '').trim()) || rows[0] || null;
    if (!pick || !Number.isFinite(Number(pick.familyId))) return '';
    const level = Number(guided.level) || 60;
    const buybackEl = document.getElementById('ccGuidedBuybackFlag');
    const buyback = !!(buybackEl && buybackEl.checked);
    let header = `${pick.familyId}, 0, 1, ${level}|`;
    if (buyback) header += ' 9, 1|';
    const seedBase = { familyId: Number(pick.familyId), itemId: Number(pick.itemId) };
    const seed = getSeed(seedBase);
    if (Number(seed) !== 0) header += ` 2, ${seed}||`;
    else header += '|';
    return header;
  }

  function partFamilyIdOf(p){
    if (!p) return null;
    if (p.familyId != null && Number.isFinite(Number(p.familyId))) return Number(p.familyId);
    if (p.family != null && Number.isFinite(Number(p.family))) return Number(p.family);
    const idRaw = String((p.idRaw ?? p.idraw ?? '') || '').trim();
    const m = idRaw.match(/^(\d+)\s*:/);
    return m ? Number(m[1]) : null;
  }

  function partItemIdOf(p){
    if (!p) return null;
    if (p.id != null && Number.isFinite(Number(p.id))) return Number(p.id);
    const idRaw = String((p.idRaw ?? p.idraw ?? '') || '').trim();
    const m = idRaw.match(/^\d+\s*:\s*(\d+)\s*$/);
    return m ? Number(m[1]) : null;
  }

  function isPearlWeaponMainPart(p){
    if (!p) return false;
    const fam = partFamilyIdOf(p);
    const item = partItemIdOf(p);
    const key = (Number.isFinite(fam) && Number.isFinite(item)) ? `${Number(fam)}:${Number(item)}` : '';
    if (key && PEARL_WEAPON_MAINPART_ID_SET.has(key)) return true;
    const code = String(normCode(p && p.code || '') || '').toLowerCase();
    const name = String((p && p.name) || '').toLowerCase();
    for (let i=0; i<PEARL_WEAPON_MAINPART_HINTS.length; i++){
      const h = PEARL_WEAPON_MAINPART_HINTS[i];
      if (!h) continue;
      if (code.includes(h) || name.includes(h)) return true;
    }
    return false;
  }

  function setSelectOptions(sel, options, {placeholder='Select...', getLabel=(x)=>x, getValue=(x)=>x, groupBy=null, getTitle=null, decorateOption=null}={}){
    sel.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = placeholder;
    sel.appendChild(ph);

    if (!options || !options.length) return;

    const __ccSeen = new Set();

    if (groupBy){
      const groups = new Map();
      for (const o of options){
        const __v = String(getValue(o));
        if (__ccSeen.has(__v)) continue;
        __ccSeen.add(__v);
        const g = groupBy(o) || 'Other';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(o);
      }
      for (const [g, arr] of groups){
        const og = document.createElement('optgroup');
        og.label = g;
        for (const o of arr){
          const opt = document.createElement('option');
          opt.value = getValue(o);
          opt.textContent = getLabel(o);
          try{
            const __idRaw = (o && (o.idRaw ?? o.idraw ?? o.id_raw));
            if (__idRaw !== undefined && __idRaw !== null && String(__idRaw).trim() && !String(opt.textContent).includes(String(__idRaw))) {
              opt.textContent = `${opt.textContent} [${String(__idRaw).trim()}]`;
            }
          }catch(_e){}
          let tip = '';
          if (typeof getTitle === 'function') { try{ tip = String(getTitle(o) || '').trim(); }catch(_e){} }
          if (!tip && typeof window.partTooltipText === 'function') { try{ tip = String(window.partTooltipText(o) || '').trim(); }catch(_e){} }
          if (tip) opt.title = tip;
          if (typeof decorateOption === 'function') { try{ decorateOption(opt, o); }catch(_e){} }
          og.appendChild(opt);
        }
        sel.appendChild(og);
      }
      return;
    }

    for (const o of options){
      const __v = String(getValue(o));
      if (__ccSeen.has(__v)) continue;
      __ccSeen.add(__v);
      const opt = document.createElement('option');
      opt.value = getValue(o);
      opt.textContent = getLabel(o);
      try{
        const __idRaw = (o && (o.idRaw ?? o.idraw ?? o.id_raw));
        if (__idRaw !== undefined && __idRaw !== null && String(__idRaw).trim() && !String(opt.textContent).includes(String(__idRaw))) {
          opt.textContent = `${opt.textContent} [${String(__idRaw).trim()}]`;
        }
      }catch(_e){}
      let tip = '';
      if (typeof getTitle === 'function') { try{ tip = String(getTitle(o) || '').trim(); }catch(_e){} }
      if (!tip && typeof window.partTooltipText === 'function') { try{ tip = String(window.partTooltipText(o) || '').trim(); }catch(_e){} }
      if (tip) opt.title = tip;
      if (typeof decorateOption === 'function') { try{ decorateOption(opt, o); }catch(_e){} }
      sel.appendChild(opt);
    }
  }

  function mergeLegacyClassModPartsIntoAllParts(){
    try{
      const src = (window.parent && window.parent.__LEGACY_CLASSMOD_PARTS_BY_KEY) ? window.parent.__LEGACY_CLASSMOD_PARTS_BY_KEY
                : (window.__LEGACY_CLASSMOD_PARTS_BY_KEY ? window.__LEGACY_CLASSMOD_PARTS_BY_KEY : null);
      if (!src) return;
      const all = getAllParts();
      if (!Array.isArray(all) || !all.length) return;

      // Track existing Character-category idRaw tokens so we don't duplicate the rows this merger owns.
      // (Classmod rows may already exist in ALL_PARTS with the same idRaw but under "Classmod".)
      const existing = new Set(
        all
          .filter(p => String((p && p.category) || '').trim() === 'Character')
          .map(p => String(p && p.idRaw ? p.idRaw : ''))
      );

      // Derive a family id per character key by matching the first Name+Skin row against the base dataset,
      // falling back to STX_RARITIES mapping when needed.
      const famByKey = {};
      for (const [key, list] of Object.entries(src)){
        if (!Array.isArray(list) || !list.length) continue;
        const first = list.find(r => Array.isArray(r) && r.length >= 2) || list[0];
        const pid = Number(first[0]);
        const pname = String(first[1] || '').trim();

        let fam = null;
        const hit = all.find(p => Number(p && p.id) === pid && String(p && p.name || '').trim() === pname && p.family != null);
        if (hit) fam = Number(hit.family);

        if (!fam){
          const cap = key ? (key.charAt(0).toUpperCase() + key.slice(1)) : '';
          const fallback = classModFamilyIdForCharacter(cap);
          if (fallback) fam = Number(fallback);
        }

        if (fam) famByKey[key] = fam;
      }

      // Materialize legacy rows as normal part objects so the builder can treat them like any other pool.
      for (const [key, list] of Object.entries(src)){
        if (!Array.isArray(list) || !list.length) continue;
        const fam = famByKey[key];
        if (!fam) continue;

        for (const row of list){
          if (!Array.isArray(row) || row.length < 2) continue;
          const id = Number(row[0]);
          const name = String(row[1] || '').trim();
          const kind = String(row[2] || '').trim(); // e.g., Skill, Perk, Rarity, Name+Skin
          const idRaw = `${fam}:${id}`;
          if (existing.has(idRaw)) continue;
          existing.add(idRaw);

          all.push({
            category: 'Character',
            manufacturer: 'characters',
            itemType: '',
            weaponType: '',
            partType: kind,
            // Use brace token for "code mode" compatibility; idRaw is used in numeric mode.
            code: `""{${fam}:${id}}""`,
            name,
            idRaw,
            family: fam,
            id
          });
        }
      }
    }catch(_e){}
  }

  function classModFamilyIdForCharacter(charName){
    try{
      const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
      const raw = String(charName || '').trim();
      if (!raw) return null;

      // Accept either internal family names (Siren/Paladin/Exo Soldier/Gravitar/Robodealer)
      // or displayed BL4 character names (Vex/Amon/Rafa/Harlowe).
      const aliasByLower = { 'vex':'Siren', 'amon':'Paladin', 'rafa':'Exo Soldier', 'harlowe':'Gravitar', 'c4sh':'Robodealer', 'robodealer':'Robodealer' };
      const lc = raw.toLowerCase();
      const name = aliasByLower[lc] || raw;

      // Primary: manufacturer exact match for Class Mod rows
      let row = rows.find(r =>
        String(r && r.itemType || '') === 'Class Mod' &&
        String(r && r.manufacturer || '').trim() === name
      );
      if (row && row.familyId != null) return row.familyId;

      // Fallback: match by itemTypeString slug (e.g., classmod_paladin...)
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
      row = rows.find(r => {
        const it = String(r && r.itemType || '');
        const its = String(r && r.itemTypeString || '').toLowerCase();
        if (it !== 'Class Mod' && !/class\s*mod|classmod/i.test(its)) return false;
        return its.includes('classmod_' + slug);
      });
      if (row && row.familyId != null) return row.familyId;

      // Stable fallback when STX_RARITIES does not expose Class Mod rows.
      const famFallbackByLower = {
        vex: 254, siren: 254,
        amon: 255, paladin: 255,
        rafa: 256, 'exo soldier': 256, 'exo-soldier': 256, exosoldier: 256,
        harlowe: 259, gravitar: 259,
        c4sh: 404, robodealer: 404
      };
      const fam = famFallbackByLower[lc] ?? famFallbackByLower[String(name || '').toLowerCase()];
      return Number.isFinite(Number(fam)) ? Number(fam) : null;
    }catch(_e){ return null; }
  }

  function classModKeyForCharacter(charName){
    const raw = String(charName || '').trim().toLowerCase();
    if (!raw) return null;
    const byLower = {
      vex: 'vex', siren: 'vex',
      amon: 'amon', paladin: 'amon',
      rafa: 'rafa', 'exo soldier': 'rafa', 'exo-soldier': 'rafa', exosoldier: 'rafa',
      harlowe: 'harlowe', gravitar: 'harlowe',
      c4sh: 'c4sh', robodealer: 'c4sh'
    };
    return byLower[raw] || null;
  }

  function getLegacyClassModPartsByKind(charName, kindMatcher){
    try{
      const src = (window.parent && window.parent.__LEGACY_CLASSMOD_PARTS_BY_KEY) ? window.parent.__LEGACY_CLASSMOD_PARTS_BY_KEY
                : (window.__LEGACY_CLASSMOD_PARTS_BY_KEY ? window.__LEGACY_CLASSMOD_PARTS_BY_KEY : null);
      if (!src) return [];
      const key = classModKeyForCharacter(charName);
      if (!key || !Array.isArray(src[key])) return [];
      const fam = classModFamilyIdForCharacter(charName);
      if (!Number.isFinite(Number(fam))) return [];
      const out = [];
      for (const row of src[key]){
        if (!Array.isArray(row) || row.length < 2) continue;
        const id = Number(row[0]);
        const name = String(row[1] || '').trim();
        const kind = String(row[2] || '').trim();
        if (!Number.isFinite(id) || !name) continue;
        const k = kind.toLowerCase();
        const keep = (typeof kindMatcher === 'function')
          ? !!kindMatcher(k, kind)
          : (String(kindMatcher || '').toLowerCase() === k);
        if (!keep) continue;
        let normalizedPartType = kind || 'Perk';
        if (k === 'skill') normalizedPartType = 'Skill';
        else if (k === 'perk') normalizedPartType = 'Perk';
        else if (k === 'firmware') normalizedPartType = 'Firmware';
        else if (k === 'item card') normalizedPartType = 'Rarity';
        out.push({
          category: 'Character',
          manufacturer: 'characters',
          itemType: '',
          weaponType: '',
          partType: normalizedPartType,
          code: `""{${Number(fam)}:${id}}""`,
          name,
          idRaw: `${Number(fam)}:${id}`,
          family: Number(fam),
          id
        });
      }
      return out;
    }catch(_e){ return []; }
  }

  function getLegacyClassModNameParts(charName){
    return getLegacyClassModPartsByKind(charName, (k)=>k.startsWith('name+skin'));
  }

  function getLegacyClassModSkillParts(charName){
    return getLegacyClassModPartsByKind(charName, (k)=>k === 'skill');
  }

  function verifyC4shLegacyClassModSkillParts(){
    const parts = getLegacyClassModSkillParts('c4sh');
    if (!Array.isArray(parts) || parts.length === 0){
      throw new Error('C4sh legacy classmod skill parts missing (count=' + (parts && parts.length) + ')');
    }
    const hasSplash = parts.some(p => String(p.name || '').trim().toLowerCase() === 'splash the pot');
    if (!hasSplash){
      throw new Error('C4sh legacy classmod skill part "Splash the pot" missing');
    }
    return {ok:true,count:parts.length};
  }

  if (typeof window !== 'undefined'){
    window.verifyC4shLegacyClassModSkillParts = verifyC4shLegacyClassModSkillParts;
    try {
      const check = verifyC4shLegacyClassModSkillParts();
      // Debug log removed for production build.
    } catch(e){
      console.error('verifyC4shLegacyClassModSkillParts failed:', e);
    }
  }

  function filterParts({category, manufacturer, weaponType, partType}){
    const isClassMod = (String(category||'') === 'Class Mod');
    let datasetCategory = isClassMod ? 'Character' : String(category||'');
    const __wt = String(weaponType||'').trim();
    const __isHeavyWeapon = (!isClassMod && String(category||'') === 'Weapon' && (__wt === 'Heavy Weapon' || __wt === 'Heavy' || /heavy\s*weapon/i.test(__wt)));
const all = getAllParts();

    return all.filter(p => {
      const code = String((p && p.code) ? p.code : '').trim();
      const pt   = String((p && p.partType) ? p.partType : '').trim();

      // Exclude skins/cosmetics from the parts universe (skins are handled via the dedicated Skin dropdown)
      if (/^\{\s*27\s*:\s*\d+\s*\}$/.test(code)) return false; // weapon skin token
      if (/skin/i.test(pt) && !/^Name\+Skin/i.test(pt)) return false; // defensive: true Skin/Cosmetic parts (allow Class Mod Name+Skin)

      // Category filter (Class Mod uses the Character dataset category)
      // Weapons are split across multiple internal categories in some datasets (e.g. Prefix/Rarity pools).
      // For Heavy Weapons, do NOT force a category swap; instead, allow the relevant sub-pools.
      if (datasetCategory){
        const pc = String(p.category||'');
        if (isClassMod){
          const pcNorm = pc.trim().toLowerCase().replace(/\s+/g, '');
          if (!(pcNorm === 'character' || pcNorm === 'classmod')) return false;
        } else if (__isHeavyWeapon){
          const allow = (pc === datasetCategory || pc === 'Prefix' || pc === 'Rarity' || pc === 'Gadget');
          if (!allow) return false;
        } else if (String(category||'') === 'Weapon'){
          // Allow Prefix/Rarity pools for weapons so main/rarity selectors populate consistently.
          if (!(pc === datasetCategory || pc === 'Prefix' || pc === 'Rarity')) return false;
        } else {
          if (pc !== datasetCategory) return false;
        }
      }

      // Manufacturer filter (do NOT apply for Class Mods; their dataset manufacturer is generic)
      // Can be disabled via the "All manufacturers parts" toggle.
      if (!isAllPartsEnabled() && !isClassMod && manufacturer && String(p.manufacturer||'').trim().toLowerCase() !== String(manufacturer||'').trim().toLowerCase()){
        // Many non-weapon pools are stored under a generic/blank manufacturer.
        // Treat those as universal so selecting a real manufacturer (Daedalus/Jakobs/etc.) still shows parts.
        const pm = String(p.manufacturer || '').trim().toLowerCase();
        const cm = String(datasetCategory || '').trim().toLowerCase();
        const allowGeneric = (pm === '' || pm === 'gadgets' || pm === 'generic' || pm === 'all' || pm === 'universal');
        const isNonWeapon = (cm !== 'weapon' && cm !== 'character' && cm !== 'prefix');
        // Heavy Weapon Firmware/Payload parts use manufacturer "gadgets" and heavy_weapon_gadget codes - allow them
        const isHeavyFirmwarePayload = (__isHeavyWeapon && allowGeneric && /heavy_weapon_gadget/i.test(String(code||'')));
        // Heavy Weapon Legendary Perks use manufacturer "gadgets" and are in Gadget category - allow them
        const wantPt = String(partType || '').trim().toLowerCase();
        const isHeavyLegendaryPerks = (__isHeavyWeapon && pm === 'gadgets' && wantPt === 'legendary perks' && String(p.category||'').trim() === 'Gadget');
        if (!(allowGeneric && isNonWeapon) && !isHeavyFirmwarePayload && !isHeavyLegendaryPerks) return false;
      }

      // Heavy Weapon parts are stored in the Gadget category with _HW codes (MAL_HW, BOR_HW, etc.).
      // Firmware and Payload use heavy_weapon_gadget prefix. Element uses Weapon.part_* (shared pool).
      // Element Switch (Maliwan) uses Weapon.part_secondary_elem_*_mal. Legendary Perks use Gadget + manufacturer gadgets.
      // Unique barrels (part_unique_barrel) have partType Barrel and appear in the Barrel dropdown.
      if (typeof __isHeavyWeapon !== 'undefined' && __isHeavyWeapon){
        const wantPt = String(partType || '').trim().toLowerCase();
        const isFirmwareOrPayload = (wantPt === 'firmware' || wantPt === 'payload');
        const isElement = (wantPt === 'element');
        const isElementSwitch = (wantPt === 'element switch');
        const isLegendaryPerks = (wantPt === 'legendary perks');
        const hasHwCode = /_HW[\._]/i.test(code) || /_HW/i.test(code);
        const hasHeavyGadgetCode = /heavy_weapon_gadget/i.test(code);
        const hasWeaponElementCode = /weapon\.part_(corrosive|cryo|fire|radiation|shock|secondary_elem)/i.test(code);
        const hasElementSwitchCode = hasWeaponElementCode && /_mal/i.test(code);
        const isHeavyLegendaryPerk = (isLegendaryPerks && String(p.category||'').trim() === 'Gadget' && pt === 'legendary perks');
        const isWeaponLegendaryPerk = (isLegendaryPerks && String(p.category||'').trim() === 'Weapon' && pt === 'legendary perks');
        const codeOk = hasHwCode || (isFirmwareOrPayload && hasHeavyGadgetCode) || (isElement && hasWeaponElementCode) ||
          (isElementSwitch && hasElementSwitchCode) || isHeavyLegendaryPerk || isWeaponLegendaryPerk;
        if (!codeOk) return false;
      }

      // Weapon type filter
      if (weaponType){
        const pwt = p.weaponType || p.itemType || '';
        if (pwt && String(pwt) !== String(weaponType)){
          // Normalize Sniper <-> Sniper Rifle (dataset uses both)
          const pwtN = String(pwt).trim().toLowerCase();
          const wtN = String(weaponType).trim().toLowerCase();
          if ((pwtN === 'sniper' && wtN === 'sniper rifle') || (pwtN === 'sniper rifle' && wtN === 'sniper')) { /* match */ }
          else if (__isHeavyWeapon){
            // Heavy Weapon parts often live under Gadget/Prefix/Rarity pools; don't drop them due to a mismatched itemType.
            // Element Switch (Maliwan) and Legendary Perks use shared pools with different weaponType - allow them.
            const pwtL = String(pwt||'').trim().toLowerCase();
            const wantPt = String(partType || '').trim().toLowerCase();
            const isElementSwitch = (wantPt === 'element switch');
            const isLegendaryPerks = (wantPt === 'legendary perks');
            const hasElementSwitchCode = /weapon\.part_secondary_elem/i.test(code) && /_mal/i.test(code);
            const allowMismatch = (pwtL === 'gadget' || pwtL === 'weapon' || pwtL === 'prefix' || pwtL === 'rarity' || pwtL === '') ||
              (isElementSwitch && hasElementSwitchCode) || isLegendaryPerks;
            if (!allowMismatch) return false;
          } else {
            return false;
          }
        }
      }
// Class Mod: scope character-specific pools by the selected character family.
      if (isClassMod && !isAllPartsEnabled()){
        const fam = classModFamilyIdForCharacter(manufacturer);
        if (fam != null){
          let pfam = (p && p.family != null) ? Number(p.family) : null;
          if (!Number.isFinite(pfam) && p && p.familyId != null) pfam = Number(p.familyId);
          if (!Number.isFinite(pfam)){
            const idRaw = String((p && (p.idRaw || p.idraw)) || '').trim();
            const m = idRaw.match(/^(\d+)\s*:/);
            if (m) pfam = Number(m[1]);
          }
          const want = String(partType || '');
          // Only scope class-specific pools. Perks (family 234) are universal and must not be filtered by class.
          const classScoped = (want === 'Body' || want === 'Name+Skin' || want === 'Rarity' || want === 'Skill');
          if (classScoped && Number.isFinite(pfam) && pfam !== Number(fam)) return false;
        }
      }

      // Part type filter (special-case Enhancement Core + Class Mod pools)
      const isEnhCore = (String(category||'') === 'Enhancement' && String(partType||'') === 'Core');
      const isCM = (String(category||'') === 'Class Mod');

      if (partType !== undefined && !isEnhCore){
        // Class Mod special cases:
        // - Legendary bodies often use an empty partType but codes like "leg_body_01".
        // - Name/Skin variants include "Name+Skin+Leg Effect" and should be matched by prefix.
        if (isCM){
          const want = String(partType||'').trim();
          const wantNorm = want.toLowerCase();
          const ptL = String(pt||'').trim();
          const ptNorm = ptL.toLowerCase();
          const codeL = String(code||'').toLowerCase();

          if (wantNorm === 'body'){
            const isBody = (ptNorm === 'body');
            const isLegBody = codeL.includes('leg_body_');
            if (!(isBody || isLegBody)) return false;
          } else if (wantNorm === 'name+skin'){
            if (!ptNorm.startsWith('name+skin')) return false;
          } else if (wantNorm === 'skill'){
            if (ptNorm !== 'skill') return false;
          } else if (wantNorm === 'perk'){
            if (ptNorm !== 'perk') return false;
          } else if (wantNorm === 'universal'){
            if (ptNorm !== 'perk') return false;
            if (codeL.includes('statspecial')) return false;
            // Secondary bucket: any stat2-style perk variants.
            if (/(^|[._])stat2([._]|$)/.test(codeL)) return false;
          } else if (wantNorm === 'secondary'){
            if (ptNorm !== 'perk') return false;
            if (codeL.includes('statspecial')) return false;
            if (!/(^|[._])stat2([._]|$)/.test(codeL)) return false;
          } else if (wantNorm === 'firmware'){
            const isFirmware = (ptNorm === 'firmware' || /firmware/.test(codeL));
            const isCorrectClassModFirmware = isFirmware && codeL.includes('part_firmware');
            if (!isCorrectClassModFirmware) return false;
          } else if (wantNorm === 'rarity'){
            if (!(ptNorm === 'rarity' || ptNorm === 'item card')) return false;
          } else {
            if (String(p.partType||'') !== String(partType||'')) return false;
          }
        } else if (String(partType||'').trim().toLowerCase() === 'element switch'){
          const codeL = String(code||'').toLowerCase();
          const pm = String(p.manufacturer||'').trim().toLowerCase();
          if (pm !== 'maliwan') return false;
          if (!codeL.includes('part_secondary_elem') || !codeL.includes('_mal')) return false;
        } else if (String(category||'') === 'Weapon' && String(partType||'').trim().toLowerCase() === 'body') {
          const codeL = String(code||'').toLowerCase();
          if (String(pt||'').trim().toLowerCase() !== 'body') return false;
          if (codeL.includes('part_body_bolt') || codeL.includes('part_body_flap')) return false;
        } else if (String(category||'') === 'Weapon' && String(partType||'').trim().toLowerCase() === 'body accessory') {
          const codeL = String(code||'').toLowerCase();
          const ptNorm = String(pt||'').trim().toLowerCase();
          const isAcc = ptNorm === 'body accessory';
          const isBoltSlotMis = ptNorm === 'body' && (codeL.includes('part_body_bolt') || codeL.includes('part_body_flap'));
          if (!(isAcc || isBoltSlotMis)) return false;
        } else {
          if (String(p.partType||'') !== String(partType||'')) return false;
        }
      }

      // Enhancement: treat "Core" as manufacturer perk (part_core_*) rather than relying on partType fields.
      if (isEnhCore){
        const codeL = String(code||'').toLowerCase();
        const ptL   = String(pt||'').toLowerCase();
        if (!(ptL === 'core' || codeL.includes('part_core_') || codeL.includes('.part_core_'))) return false;
      }

      return true;
    });
  }

  function refreshTopSelectors(){
    try{ mergeLegacyClassModPartsIntoAllParts(); }catch(_e){}
    const all = getAllParts();
    $('dsStatus').textContent = all.length ? `loaded (${all.length} parts)` : 'not loaded';

    // Item Type options from known categories
    const categories = unique(all.map(p=>{
      var c = String(p.category||'').trim();
      if (/^class\s*mod$/i.test(c) || /^classmod$/i.test(c)) return 'Class Mod';
      return c;
    })).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));

    // Surface "Class Mod" even though parts live under the Character category in ALL_PARTS
    const hasClassMod = (() => {
      try{
        if (categories.includes('Class Mod')) return true;
        const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
        if (rows.some(r => /class\s*mod|classmod/i.test(String((r && r.itemType) || '') + ' ' + String((r && r.itemTypeString) || '')))) return true;
      }catch(_e){}
      return all.some(p => /classmod/i.test(String((p && p.code) ? p.code : '')));
    })();

    // Keep a stable order (like Scooter)
    const preferred = ['Weapon','Shield','Repkit','Grenade','Gadget','Enhancement','Other','Class Mod'];
    const visibleCats = (hasClassMod ? categories.filter(c => c !== 'Character' && c !== 'Prefix') : categories.filter(c => c !== 'Prefix'))
      .filter(c => c !== 'Firmware');
    let ordered = preferred.filter(x => x === 'Class Mod' ? hasClassMod : visibleCats.includes(x))
      .concat(visibleCats.filter(x => !preferred.includes(x)));

    if (!ordered.includes('Weapon')) ordered.unshift('Weapon');
    if (hasClassMod && !ordered.includes('Class Mod')) ordered.push('Class Mod');

    setSelectOptions($('itemType'), ordered, {
      placeholder: 'Select item type...',
      decorateOption(opt, cat){
        const url = stxItemTypeIconUrl(cat);
        if (url) opt.setAttribute('data-cc-icon', url);
        else opt.removeAttribute('data-cc-icon');
      }
    });
    if (state.itemType && !ordered.includes(state.itemType)) state.itemType = ordered[0] || '';
    $('itemType').value = state.itemType || '';
    stxSyncCustomSelectIfWrapped($('itemType'));

    refreshManufacturer();
    refreshWeaponType();
    refreshRarity();
    refreshMainPart();
    updateModeLabel();
  }

  /** Canonical weapon manufacturers from dataset/rarities - ensures none are ever missing from dropdowns. */
  const CANONICAL_WEAPON_MANS = ['Daedalus','Jakobs','Maliwan','Order','Ripper','Tediore','Torgue','Vladof'];
  const CANONICAL_HEAVY_MANS = ['Maliwan','Ripper','Torgue','Vladof'];

  /** Rarity-sheet row `itemType` values that are weapon families (not shields, class mods, etc.). */
  const STX_RARITY_WEAPON_ITEM_TYPES = new Set([
    'Assault Rifle', 'Pistol', 'Shotgun', 'SMG', 'Sniper Rifle', 'Sniper', 'Heavy Weapon', 'Submachine Gun'
  ]);

  /**
   * Rows from STX_RARITIES used to build the "allowed manufacturers" set for the final guard.
   * Must NOT mix in Class Mod / Character rows — that leaked Siren, Robodealer, etc. into Weapon.
   */
  function stxRarityRowsForManufacturerAllowlist(cat, wtNormForWeapon){
    const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
    const catStr = String(cat || '').trim();
    if (catStr === 'Weapon'){
      const wn = String(wtNormForWeapon || '').trim();
      const wfixed = (wn === 'Heavy') ? 'Heavy Weapon' : wn;
      if (wfixed){
        return rows.filter(function (r){
          return String(r && r.itemType || '').trim() === wfixed;
        });
      }
      return rows.filter(function (r){
        return STX_RARITY_WEAPON_ITEM_TYPES.has(String(r && r.itemType || '').trim());
      });
    }
    const gear = { Shield: 1, Grenade: 1, Repkit: 1, Gadget: 1, Enhancement: 1 };
    if (gear[catStr]){
      return rows.filter(function (r){
        return String(r && r.itemType || '').trim() === catStr;
      });
    }
    if (catStr === 'Other') return [];
    return rows.filter(function (r){
      return String(r && r.itemType || '').trim() === catStr;
    });
  }

  /** Vault-hunter / class-mod family names — never show in non–Class Mod manufacturer lists. */
  const STX_CLASS_MOD_ONLY_MANUFACTURERS = new Set([
    'siren', 'paladin', 'exo soldier', 'exosoldier', 'gravitar', 'robodealer', 'c4sh', 'universal'
  ]);

  /** Returns {mans: string[], isClassMod: boolean} for a given category. Use from Guided Builder via window.getManufacturersForCategory. */
  function computeManufacturersForCategory(catUi, weaponTypeForCat){
    const catUiNorm = (catUi === 'Heavy Weapon') ? 'Heavy' : catUi;
    if (String(catUiNorm || catUi || '').trim() === 'Other'){
      return { mans: ['AI Car Guns'], isClassMod: false };
    }
    const cat = (catUiNorm === 'Heavy') ? 'Weapon' : catUiNorm;
    const isClassMod = /class\s*mod/i.test(String(catUiNorm||''));
    let mans = [];
    if (isClassMod){
      try{
        const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
        mans = unique(
          rows
            .filter(r => String(r && r.itemType || '') === 'Class Mod' || /class\s*mod|classmod/i.test(String(r && r.itemTypeString || '')))
            .map(r => String(r && r.manufacturer || '').trim())
            .filter(Boolean)
        ).map(m => (/^c4sh$/i.test(m) || /^robodealer$/i.test(m)) ? 'Robodealer' : m);
        mans = unique(mans).sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true}));
      
      // Guard against mis-tagged manufacturer values like "characters"
      mans = mans.filter(x => String(x).trim().toLowerCase() !== 'characters');
      const __cmFallback = ['Siren','Paladin','Exo Soldier','Gravitar','Robodealer'];
      // If the sheet/dataset ever fails to expose the classmod families, use the known set.
      if (!mans.length || !__cmFallback.some(v => mans.includes(v))) {
        mans = __cmFallback.slice();
      }
}catch(_e){ mans = []; }
    } else {
      // For non-weapon categories, ALL_PARTS often uses a generic manufacturer (e.g., "gadgets"),
      // while STX_RARITIES is keyed by the real manufacturer (Daedalus/Jakobs/etc.).
      // Build the manufacturer list from both sources, preferring real manufacturers.
      const wtForMans = (cat === 'Weapon')
        ? (catUiNorm === 'Heavy' ? 'Heavy Weapon' : (weaponTypeForCat != null ? String(weaponTypeForCat).trim() : String(($('weaponType') && $('weaponType').value) || state.weaponType || '').trim()))
        : '';
      const parts = filterParts({category: cat, weaponType: wtForMans || undefined});
      const mansFromParts = unique(parts.map(p=>p.manufacturer));
      let mansFromRarity = [];
      try{
        const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
        if (cat === 'Weapon'){
          const wnorm = (String(wtForMans)==='Heavy') ? 'Heavy Weapon' : String(wtForMans||'').trim();
          if (wnorm){
            mansFromRarity = unique(
              rows
                .filter(r => String(r && r.itemType || '') === wnorm)
                .map(r => String(r && r.manufacturer || '').trim())
                .filter(Boolean)
            );
          } else {
            const nonWeapon = new Set(['Shield','Grenade','Repkit','Gadget','Enhancement','Class Mod','Character','characters']);
            mansFromRarity = unique(
              rows
                .filter(r => !nonWeapon.has(String(r && r.itemType || '').trim()))
                .map(r => String(r && r.manufacturer || '').trim())
                .filter(Boolean)
            );
          }
        } else {
          mansFromRarity = unique(
            rows
              .filter(r => String(r && r.itemType || '') === String(cat || ''))
              .map(r => String(r && r.manufacturer || '').trim())
              .filter(Boolean)
          );
        }
      }catch(_e){ mansFromRarity = []; }

      mans = unique(mansFromParts.concat(mansFromRarity))
        .filter(m => {
          const ml = String(m || '').trim().toLowerCase();
          return ml && ml !== 'gadgets' && ml !== 'generic' && ml !== 'all' && ml !== 'universal' && ml !== 'firmware' && ml !== 'weapon' && ml !== 'heavy weapon';
        })
        .sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true}));

      // If we still have nothing (or the rarity sheet is missing), fall back to parts manufacturers.
      if (!mans.length){
        mans = unique(mansFromParts)
          .filter(Boolean)
          .filter(m => {
            const ml = String(m || '').trim().toLowerCase();
            return ml && ml !== 'gadgets' && ml !== 'generic' && ml !== 'all' && ml !== 'universal' && ml !== 'firmware' && ml !== 'characters' && ml !== 'weapon' && ml !== 'heavy weapon';
          })
          .sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true}));
      }
    
      // Heavy Weapons are stored under the Gadget category with _HW codes; ensure the supported manufacturers surface
      // even if the parts-based scan fails (e.g., during partial dataset loads).
      const wtSel = (cat === 'Weapon')
        ? (catUiNorm === 'Heavy' ? 'Heavy Weapon' : (weaponTypeForCat != null ? String(weaponTypeForCat).trim() : String(($('weaponType') && $('weaponType').value) || state.weaponType || '').trim()))
        : '';
      const wtNorm = (wtSel === 'Heavy') ? 'Heavy Weapon' : wtSel;
      if (wtNorm === 'Heavy Weapon' && !mans.length){
        try{
          const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
          const hwMans = unique(rows.filter(r => String(r && r.itemType || '') === 'Heavy Weapon').map(r => String(r && r.manufacturer || '').trim()).filter(Boolean));
          mans = hwMans.length ? hwMans.sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true})) : ['Maliwan','Ripper','Torgue','Vladof'];
        }catch(_e){
          mans = ['Maliwan','Ripper','Torgue','Vladof'];
        }
      }

      // Final guard: allow only manufacturers that appear in STX_RARITIES for *this* category
      // (and weapon itemType when Weapon). A global allowlist previously pulled Class Mod names into Weapon.
      try{
        const scopedRows = stxRarityRowsForManufacturerAllowlist(cat, wtNorm);
        const allowed = unique(scopedRows.map(r => String(r && r.manufacturer || '').trim()).filter(Boolean));
        if (allowed.length){
          const allow = new Set(allowed.map(a => String(a).trim().toLowerCase()));
          mans = mans.filter(m => allow.has(String(m || '').trim().toLowerCase()));
          // Ensure canonical weapon manufacturers are never missing (Guided/Simple both use this)
          const canonical = (wtNorm === 'Heavy Weapon') ? CANONICAL_HEAVY_MANS : CANONICAL_WEAPON_MANS;
          for (const cm of canonical){
            const cml = String(cm || '').trim().toLowerCase();
            if (cml && allow.has(cml) && !mans.some(m => String(m || '').trim().toLowerCase() === cml)){
              mans.push(cm);
            }
          }
          mans.sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true}));
        }
      }catch(_e){}

      mans = mans.filter(function (m){
        const ml = String(m || '').trim().toLowerCase();
        return ml && !STX_CLASS_MOD_ONLY_MANUFACTURERS.has(ml);
      });
}
    return { mans, isClassMod };
  }

  function refreshManufacturer(){
    const catUi = $('itemType').value || state.itemType;
    state.itemType = catUi;
    const cat = (catUi === 'Heavy' || catUi === 'Heavy Weapon') ? 'Weapon' : catUi;
    const { mans, isClassMod } = computeManufacturersForCategory(catUi);

    if ($('manufacturerLabel')){
      if (isClassMod) $('manufacturerLabel').textContent = 'Character';
      else if (String(catUi).trim() === 'Other') $('manufacturerLabel').textContent = 'AI / Car / Guns';
      else $('manufacturerLabel').textContent = 'Manufacturer';
    }

    if (isClassMod){
      // Display BL4 character names while keeping internal STX mapping (familyId) intact.
      const DISP = {'Siren':'Vex','Paladin':'Amon','Exo Soldier':'Rafa','Gravitar':'Harlowe','Robodealer':'C4sh','C4sh':'C4sh'};
      const opts = mans.map(v=>({value:v, label:(DISP[v] || v)}));
      setSelectOptions($('manufacturer'), opts, {
        placeholder: 'Select character...',
        getLabel: (o)=>o.label,
        getValue: (o)=>o.value,
        decorateOption(opt, o){
          const url = stxManufacturerIconUrl(o.value, 'Class Mod');
          if (url) opt.setAttribute('data-cc-icon', url);
          else opt.removeAttribute('data-cc-icon');
        }
      });
    } else {
      setSelectOptions($('manufacturer'), mans, {
        placeholder: 'Select manufacturer...',
        decorateOption(opt, m){
          const url = stxManufacturerIconUrl(m, catUi);
          if (url) opt.setAttribute('data-cc-icon', url);
          else opt.removeAttribute('data-cc-icon');
        }
      });
    }
    // Safety: remove any disallowed pseudo-manufacturers that may slip in (e.g. Firmware)
    try{
      const bad = new Set(['firmware','gadgets','generic','all','universal','characters','weapon','heavy weapon']);
      const sel = $('manufacturer');
      if (sel && sel.options){
        Array.from(sel.options).forEach(opt=>{
          if (!opt) return;
          const v = String(opt.value||'').trim().toLowerCase();
          const t = String(opt.textContent||'').trim().toLowerCase();
          if ((v && bad.has(v)) || (t && bad.has(t))) opt.remove();
        });
        // If current selection is now invalid, choose first real option
        const cur = String(sel.value||'').trim().toLowerCase();
        if (bad.has(cur)){
          const first = Array.from(sel.options).find(o => o.value && !bad.has(String(o.value).trim().toLowerCase()));
          sel.value = first ? first.value : '';
        }
      }
    }catch(_e){}

    // attempt to keep previous (only fix when invalid, not when empty)
    if (state.manufacturer && !mans.includes(state.manufacturer)) state.manufacturer = mans[0] || '';
    $('manufacturer').value = state.manufacturer || '';
    stxSyncCustomSelectIfWrapped($('manufacturer'));

    // show weapon type row only for weapon
    const isWeapon = (cat === 'Weapon');
    $('weaponTypeRow').style.display = isWeapon ? '' : 'none';
    $('nonWeaponRow').style.display = isWeapon ? 'none' : '';
    refreshRarityUiState();

    // Heavy-as-itemType: weapon type is implicit (Heavy Weapon). Show no selectable options.
    if ((catUi === 'Heavy' || catUi === 'Heavy Weapon') && $('weaponType')) {
      setSelectOptions($('weaponType'), [], {placeholder:'(Heavy) fixed'});
      $('weaponType').disabled = true;
      $('weaponType').value = '';
      state.weaponType = 'Heavy Weapon';
      stxSyncCustomSelectIfWrapped($('weaponType'));
    } else if ($('weaponType')) {
      $('weaponType').disabled = false;
    }
    syncBuildStatsItemSlug();
  }

  function refreshWeaponType(){
    if (state.itemType !== 'Weapon') return;
    const mansel = $('manufacturer').value || '';
    state.manufacturer = mansel;

    const parts = filterParts({category:'Weapon', manufacturer: mansel});
    let wtypes = unique(parts.map(p=>p.weaponType || p.itemType).filter(Boolean));
    // Ensure Heavy Weapon appears if the rarity sheet exposes it for this manufacturer.
    try{
      const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
      const hasHeavy = mansel
        ? rows.some(r => String(r && r.manufacturer || '') === String(mansel || '') && String(r && r.itemType || '') === 'Heavy Weapon')
        : rows.some(r => String(r && r.itemType || '') === 'Heavy Weapon');
      if (hasHeavy) wtypes.push('Heavy Weapon');
    }catch(_e){}
    wtypes = unique(wtypes).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));
    setSelectOptions($('weaponType'), wtypes, {
      placeholder: 'Select weapon type...',
      decorateOption(opt, wt){
        const url = stxWeaponTypeIconUrl(wt);
        if (url) opt.setAttribute('data-cc-icon', url);
        else opt.removeAttribute('data-cc-icon');
      }
    });
    if (state.weaponType === 'Heavy') state.weaponType = 'Heavy Weapon';
    if (state.weaponType && !wtypes.includes(state.weaponType)) state.weaponType = wtypes[0] || '';
    $('weaponType').value = state.weaponType || '';
    stxSyncCustomSelectIfWrapped($('weaponType'));
    syncBuildStatsItemSlug();
  }

  function refreshRarity(){
    const sel = $('rarity');
    if (!sel) return;
    const useTierFilter = rarityTierFilterActiveForCurrentContext();
    refreshRarityUiState();

    if (!useTierFilter){
      sel.innerHTML = '';
      const auto = document.createElement('option');
      auto.value = '';
      auto.textContent = '(auto from rarity ID)';
      sel.appendChild(auto);
      sel.value = '';
      try{ state.rarity = ''; }catch(_e){}
      return;
    }

    const cur = String(sel.value || state.rarity || '').trim();
    const isClassModTierFilter = String(state.itemType || '') === 'Class Mod';
    const order = isClassModTierFilter ? [0,1,2,3,4] : [0,1,2,3,4,5];
    // Always show the full tier list so Legendary/Pearlescent are consistently available in the main rarity dropdown.
    // Part availability is still enforced later when selecting the rarity-id part.
    const opts = order.map(t => ({ value: String(t), label: rarityTierLabel(t) }));

    sel.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '(select rarity tier)';
    sel.appendChild(ph);
    for (const o of opts){
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sel.appendChild(opt);
    }

    // Keep current if valid; otherwise auto-select first available tier.
    if (cur && opts.some(o => o.value === cur)){
      sel.value = cur;
    } else if (!sel.value && opts.length){
      sel.value = opts[0].value;
    }
    try{ state.rarity = sel.value || ''; }catch(_e){}
  }

function refreshMainPart(){
    const catUi = state.itemType;                 // what the dropdown shows
    const cat   = (catUi === 'Heavy') ? 'Weapon' : catUi;  // what the data tables use
    const man = $('manufacturer').value || '';
    state.manufacturer = man;
    if (cat === 'Weapon'){
      // If UI itemType is Heavy, the weaponType row is hidden - force the correct weapon type anyway.
      state.weaponType = (catUi === 'Heavy')
        ? 'Heavy Weapon'
        : ($('weaponType').value || '');

      if (state.weaponType === 'Heavy') state.weaponType = 'Heavy Weapon';
      state.level = Number($('level').value || 1);
    } else {
      state.level = Number(($('level2') && $('level2').value) ? $('level2').value : ($('level').value || 1));
    }
    const useTierFilter = rarityTierFilterActiveForCurrentContext();
    state.rarity = useTierFilter ? ($('rarity').value || '') : '';
    const selectedRarity = parseRarityValue(state.rarity);
    let selectedTier = (selectedRarity && Number.isFinite(selectedRarity.tier)) ? Number(selectedRarity.tier) : null;
    const raritySelText = String((($('rarity') && $('rarity').selectedOptions && $('rarity').selectedOptions[0])
      ? $('rarity').selectedOptions[0].textContent
      : '') || '').trim().toLowerCase();
    const pearlTierSelected =
      (selectedTier === 5) ||
      /^6$/.test(String(state.rarity || '').trim()) ||
      /\bpearl/.test(String(state.rarity || '').trim().toLowerCase()) ||
      /\bpearl/.test(raritySelText);
    if (!Number.isFinite(selectedTier) && pearlTierSelected) selectedTier = 5;
    if (!useTierFilter) selectedTier = null;
    if (useTierFilter && !Number.isFinite(selectedTier)){
      const pendingLabel = (cat === 'Class Mod')
        ? 'Body - Classmod Name (select rarity tier first)'
        : 'Rarity ID Part (select rarity tier first)';
      $('mainPartLabel').textContent = pendingLabel;
      setSelectOptions($('mainPart'), [], {placeholder:'Select rarity tier first...'});
      $('mainPart').disabled = true;
      state.mainPart = null;
      refreshBuilder();
      syncMainPartPreview();
      return;
    }
    $('mainPart').disabled = false;

    if (cat === 'Other'){
      $('mainPartLabel').textContent = 'Select item (full serial)';
      const aicarList = getAicarSimpleBuilderParts();
      const all = getAllParts();
      for (let i = 0; i < all.length; i++) all[i].__idx = i;
      const mainPartByOptionKey = new Map();
      for (let i = 0; i < aicarList.length; i++){
        const p = aicarList[i];
        const key = `aicar:${i}`;
        try{ p.__mainOptKey = key; }catch(_e){}
        mainPartByOptionKey.set(key, p);
      }
      state.__mainPartByOptionKey = mainPartByOptionKey;
      setSelectOptions($('mainPart'), aicarList, {
        placeholder: 'Select AI / car / guns preset...',
        getLabel: dropdownLabelCompactForPart,
        getValue: (p) => String((p && p.__mainOptKey) ? p.__mainOptKey : '')
      });
      if (state.mainPart){
        const prev = state.mainPart.__fullDeserialized ? String(state.mainPart.__fullDeserialized).trim() : '';
        const match = prev ? aicarList.find(p => String(p.__fullDeserialized || '').trim() === prev) : null;
        if (match && match.__mainOptKey) $('mainPart').value = String(match.__mainOptKey);
        else { state.mainPart = null; $('mainPart').value = ''; }
      } else {
        $('mainPart').value = '';
      }
      refreshBuilder();
      syncMainPartPreview();
      return;
    }

    // Determine core part type for the Main/Prefix selector.
    // Note: "Class Mod" bodies are split into two pools:
    //  - Non-legendary: the standard Body pool (body_0x)
    //  - Legendary: the unnamed leg_body_* pool (partType == '')
    let corePt = CORE_PARTTYPE_BY_CATEGORY[cat] ?? 'Base';

    if (cat === 'Class Mod'){
      const isLegendary = useTierFilter ? (selectedTier === 4) : false;
      corePt = isLegendary ? '' : 'Body';
    }
    if (cat === 'Class Mod'){
      $('mainPartLabel').textContent = (useTierFilter && Number.isFinite(selectedTier))
        ? `Body - Classmod Name (${rarityTierLabel(selectedTier)})`
        : 'Body - Classmod Name';
    } else {
      $('mainPartLabel').textContent = (useTierFilter && Number.isFinite(selectedTier))
        ? `Rarity ID Part (${rarityTierLabel(selectedTier)})`
        : 'Rarity ID Part';
    }

    let partsList = filterParts({category: cat, manufacturer: man, weaponType: (cat==='Weapon'? state.weaponType : ''), partType: corePt});

    // Class Mod: keep the body selector aligned to the chosen rarity tier.
    if (cat === 'Class Mod'){
      const wantLegendary = (corePt === '');
      partsList = partsList.filter(p => {
        const c = String((p && p.code) ? p.code : '').toLowerCase();
        const isLeg = c.includes('leg_body_');
        return wantLegendary ? isLeg : !isLeg;
      });
      const seenMain = new Set();
      partsList = partsList.filter(p => {
        const iid = Number(partItemIdOf(p));
        const key = [
          Number.isFinite(iid) ? String(iid) : '',
          String((p && p.idRaw) || '').trim().toLowerCase(),
          String((p && p.code) || '').trim().toLowerCase(),
          String((p && p.name) || '').trim().toLowerCase()
        ].join('|');
        if (!key || seenMain.has(key)) return false;
        seenMain.add(key);
        return true;
      });
    }

    // Fallback to empty partType is useful for several categories, but for Enhancements it causes the core selector to show every enhancement pool.
    // Also: do not fall back for Class Mods, or we'd re-introduce the legendary pool when a non-legendary tier is selected.
    if (!partsList.length && cat !== 'Enhancement' && cat !== 'Class Mod' && cat !== 'Shield'){
      partsList = filterParts({category: cat, manufacturer: man, weaponType: (cat==='Weapon'? state.weaponType : ''), partType: ''});
    }

    // Heavy Weapons live in the Gadget pool (_HW codes). If the strict Weapon+Heavy filters ever miss,
    // re-scan the Gadget pool directly so the main/prefix selector never goes empty.
    if (!partsList.length && cat === 'Weapon' && (/^heavy(?:\s*weapon)?$/i.test(String(state.weaponType||'').trim()) || /heavy\s*weapon/i.test(String(state.weaponType||'')))) {
      try{
        const wantMan = isAllPartsEnabled() ? '' : String(man||'').trim().toLowerCase();
        const wantPt  = String(corePt||'').trim();
        partsList = getAllParts().filter(p=>{
          const pc = String(p.category||'').trim();
          if (pc !== 'Gadget') return false;
          const code = String((p && p.code) ? p.code : '');
          if (!/_HW/i.test(code)) return false;
          const pm = String(p.manufacturer||'').trim().toLowerCase();
          if (wantMan && pm !== wantMan) return false;
          return String(p.partType||'').trim() === wantPt;
        });
      }catch(_e){ /* ignore */ }
    }

if (cat === 'Class Mod' && !isAllPartsEnabled()){
      const fam = classModFamilyIdForCharacter(man);
      if (fam != null){
        partsList = partsList.filter(p => Number(p.familyId ?? p.family) === Number(fam));
      }
    }

    const rarityRowsForTier = useTierFilter && Number.isFinite(selectedTier)
      ? getRarityRowsForCurrentContext().filter(r => rarityTierFromItemTypeString(r && r.itemTypeString, r) === selectedTier)
      : getRarityRowsForCurrentContext();

    if (useTierFilter && !rarityRowsForTier.length && !(cat === 'Weapon' && pearlTierSelected)){
      setSelectOptions($('mainPart'), [], {placeholder:`No ${rarityTierLabel(selectedTier).toLowerCase()} parts available...`});
      $('mainPart').disabled = true;
      state.mainPart = null;
      refreshBuilder();
      syncMainPartPreview();
      return;
    }

    // Shield main parts: include any unique bodies that are stored with empty partType
    // (e.g., some legendary shields use partType "" but still have part_* codes).
    if (cat === 'Shield' && corePt !== 'Rarity'){
      const partFam = (p)=>{
        if (p && p.family != null && Number.isFinite(Number(p.family))) return Number(p.family);
        if (p && p.familyId != null && Number.isFinite(Number(p.familyId))) return Number(p.familyId);
        const idRaw = String(p && (p.idRaw || p.idraw) || '').trim();
        const m = idRaw.match(/^(\d+)\s*:/);
        return m ? Number(m[1]) : null;
      };
      const isShieldMainCandidate = (p)=>{
        const code = String(p && p.code || '').toLowerCase();
        const pt = String(p && p.partType || '').trim().toLowerCase();
        if (!code) return false;
        if (pt === 'rarity') return false;
        if (code.includes('.comp_') || code.includes('comp_')) return false;
        return (code.includes('.part_') || code.includes('part_') || pt === 'body' || pt === '');
      };
      // Prefer families available for the selected rarity tier.
      let fams = [];
      fams = rarityRowsForTier
        .map(r => Number(r && r.familyId))
        .filter(n => Number.isFinite(n));
      if (!fams.length && man && !isAllPartsEnabled()){
        try{
          const rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
          const manL = String(man||'').trim().toLowerCase();
          fams = rows
            .filter(r => String(r && r.itemType || '') === 'Shield' && String(r && r.manufacturer || '').trim().toLowerCase() === manL)
            .filter(r => rarityTierFromItemTypeString(r && r.itemTypeString, r) === selectedTier)
            .map(r => Number(r && r.familyId))
            .filter(n => Number.isFinite(n));
        }catch(_e){ fams = []; }
      }
      if (fams.length){
        const all = getAllParts();
        const famSet = new Set(fams);
        const existing = new Set(partsList.map(p => String(p.__idx ?? p.idRaw ?? p.code)));
        for (const p of all){
          if (!p || String(p.category||'') !== 'Shield') continue;
          const pf = partFam(p);
          if (pf == null || !famSet.has(pf)) continue;
          if (!isShieldMainCandidate(p)) continue;
          const key = String(p.__idx ?? p.idRaw ?? p.code);
          if (existing.has(key)) continue;
          partsList.push(p);
          existing.add(key);
        }
        // Now restrict to the current manufacturer family set to avoid cross-mfr bleed.
        partsList = partsList.filter(p => {
          const pf = partFam(p);
          return pf != null && famSet.has(pf);
        });
      }
    }

    // Non-weapon main parts: if any manufacturer-specific parts exist, hide generic pools.
    // This prevents Shield main parts from showing every manufacturer when a specific one is selected.
    if (!isAllPartsEnabled() && cat !== 'Weapon' && cat !== 'Class Mod' && man){
      const manL = String(man||'').trim().toLowerCase();
      const strict = partsList.filter(p => String(p.manufacturer||'').trim().toLowerCase() === manL);
      if (strict.length) partsList = strict;
    }

    // Weapon + Pearlescent: the Main/Prefix (barrel) dropdown should show only pearlescent item barrels.
    if (cat === 'Weapon' && pearlTierSelected && String(corePt || '').toLowerCase() === 'barrel'){
      const pearlBarrels = partsList.filter(isPearlWeaponMainPart);
      if (pearlBarrels.length){
        partsList = pearlBarrels;
      }
    }

    // Rarity-driven part selection:
    // Keep the main selector aligned with all families/items in the selected rarity tier.
    const skipRarityFamilyItemGate = !useTierFilter || (cat === 'Weapon' && pearlTierSelected);
    if (!skipRarityFamilyItemGate){
      const famSet = new Set(
        rarityRowsForTier
          .map(r => Number(r && r.familyId))
          .filter(n => Number.isFinite(n))
      );
      const itemSet = new Set(
        rarityRowsForTier
          .map(r => Number(r && r.itemId))
          .filter(n => Number.isFinite(n))
      );
      const byFam = famSet.size ? partsList.filter(p => famSet.has(partFamilyIdOf(p))) : [];
      if (byFam.length) partsList = byFam;
      const byItem = itemSet.size ? partsList.filter(p => itemSet.has(partItemIdOf(p))) : [];
      if (byItem.length) partsList = byItem;
    }

    // We need stable retrieval: attach index to dataset parts and option keys for synthetic rows.
    const all = getAllParts();
    for (let i=0;i<all.length;i++) all[i].__idx = i;

    partsList.sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));

    const mainPartByOptionKey = new Map();
    for (let i=0; i<partsList.length; i++){
      const p = partsList[i];
      let key = '';
      if (p && p.__idx != null && Number.isFinite(Number(p.__idx))){
        key = `idx:${Number(p.__idx)}`;
      } else {
        const fam = partFamilyIdOf(p);
        const item = partItemIdOf(p);
        if (Number.isFinite(fam) && Number.isFinite(item)) key = `synth:${fam}:${item}`;
        else key = `local:${i}`;
      }
      try{ p.__mainOptKey = key; }catch(_e){}
      mainPartByOptionKey.set(key, p);
    }
    state.__mainPartByOptionKey = mainPartByOptionKey;

    setSelectOptions($('mainPart'), partsList, {
      placeholder:(useTierFilter && Number.isFinite(selectedTier))
        ? `Select rarity ID part (${rarityTierLabel(selectedTier)})...`
        : 'Select rarity ID part...',
      getLabel: dropdownLabelCompactForPart,
      getValue: (p)=>String((p && p.__mainOptKey) ? p.__mainOptKey : ''),
      decorateOption: stxApplyCompPartOptionDecoration
    });

    // keep selected mainPart if still matches
    if (state.mainPart){
      const isGuidedClassMod = (() => {
        try {
          const gi = document.getElementById('ccGuidedItemType');
          return !!(gi && /class\s*mod|classmod/i.test(String(gi.value || '').trim()));
        } catch (_) { return false; }
      })();
      const checklistCompRarity = isGuidedClassMod && cat === 'Class Mod' && String(state.mainPart.partType || '').trim().toLowerCase() === 'rarity';
      if (checklistCompRarity) {
        // Guided checklist sets comp-rarity tokens; #mainPart only lists Body parts — do not clear synthetic rarity.
        refreshBuilder();
        syncMainPartPreview();
        return;
      }
      const prevTok = tokenForPart(state.mainPart);
      const match = partsList.find(p => {
        if (p && state.mainPart && p.__idx != null && state.mainPart.__idx != null && p.__idx === state.mainPart.__idx) return true;
        return tokenForPart(p) === prevTok;
      });
      if (match) $('mainPart').value = String((match && match.__mainOptKey) ? match.__mainOptKey : '');
      else { state.mainPart = null; $('mainPart').value=''; }
    } else {
      $('mainPart').value = '';
    }

    refreshBuilder();
    syncMainPartPreview();
  }

  function clearBuilderState(keepTop=false){
    state.detectedCategory = null;
    state.mainPart = keepTop ? state.mainPart : null;
    state.slots = {};
    state.primaryElement = 'None';
    state.elementStack = [];
    state.extras = [];
  }

  function detectCategoryFromMainPart(p){
  if (!p) return null;
  if (p.__isAicarFullItem || p.__fullDeserialized) return 'Other';
  // Class Mods are stored under the "Character" category in the dataset, but the STX builder
  // needs to treat them as "Class Mod" so the correct schema + ordering is used.
  if (String(state.itemType || '') === 'Class Mod') return 'Class Mod';
  // Keep Enhancement locked when selected in the left panel.
  if (String(state.itemType || '') === 'Enhancement') return 'Enhancement';
  const pcat = String((p && p.category) || '').trim();
  if (pcat === 'Rarity' && String(state.itemType || '').trim()) return String(state.itemType || '').trim();
  const code = String((p && p.code) ? p.code : '');
  if (/classmod_/i.test(code)) return 'Class Mod';
  return p.category || null;
}

  function isBarrelFamilySchemaSlot(schemaItem, category){
    if (!schemaItem) return false;
    if (schemaItem.key !== 'barrel' && schemaItem.key !== 'barrelAcc') return false;
    return category === 'Weapon' || category === 'Gadget';
  }

  function splitEffectPerkBodyForPreview(ef){
    const s = String(ef || '').trim();
    if (!s) return { perk: '', body: '' };
    const idx = s.indexOf(' - ');
    if (idx >= 0){
      return { perk: s.slice(0, idx).trim(), body: s.slice(idx + 3).trim() };
    }
    if (s.length <= 52 && s.indexOf('.') === -1 && s.split(/\s+/).length <= 6){
      return { perk: s, body: '' };
    }
    return { perk: '', body: s };
  }

  function stripStatsHeadlineIfRedundantForPreview(statsRaw, title){
    const st = String(statsRaw || '').replace(/\s+/g, ' ').trim();
    const tl = String(title || '').replace(/\s+/g, ' ').trim();
    if (!st || !tl) return st;
    if (st.toLowerCase().indexOf(tl.toLowerCase()) !== 0) return st;
    const rest = st.slice(tl.length).replace(/^,\s*/, '').trim();
    return rest || st;
  }

  function barrelHeadlineTitleForPreview(p){
    if (!p) return '';
    const st = String(p.stats != null ? p.stats : (p.stats_text || '')).replace(/\s+/g, ' ').trim();
    if (st && st.indexOf(',') > 0){
      const head = st.slice(0, st.indexOf(',')).trim();
      if (head.length >= 3 && head.length <= 88) return head;
    }
    const nm = String((p.legendaryName || p.name || '')).trim();
    if (nm) return nm;
    return String(displayForPart(p) || '').trim();
  }

  /** Rich preview for barrel / barrel accessory slots: title from stats, perk line, then detail + meta. */
  function formatBarrelFamilyPartPreviewHtml(part){
    if (!part) return '';
    const lines = [];
    const title = barrelHeadlineTitleForPreview(part);
    if (title) lines.push('<div class="stx-part-preview__title">' + escapeHtml(title) + '</div>');
    const efRaw = String(part.effects != null ? part.effects : (part.effect ?? part.effects_text ?? '')).trim();
    const split = splitEffectPerkBodyForPreview(efRaw);
    if (split.perk) lines.push('<div class="stx-part-preview__barrel-perk">' + escapeHtml(split.perk) + '</div>');
    const statsRaw = String(part.stats != null ? part.stats : (part.stats_text || '')).replace(/\s+/g, ' ').trim();
    const statsTail = statsRaw ? stripStatsHeadlineIfRedundantForPreview(statsRaw, title) : '';
    const descParts = [];
    if (split.body) descParts.push(split.body);
    if (statsTail) descParts.push(statsTail);
    if (descParts.length){
      const descText = (descParts.length === 2 && split.body)
        ? (split.body + '\n\n' + statsTail)
        : descParts.join('\n\n');
      lines.push('<div class="stx-part-preview__barrel-desc">' + escapeHtml(descText) + '</div>');
    }
    lines.push('<div class="stx-part-preview__barrel-meta">');
    try{
      const tok = tokenForPart(part);
      if (tok) lines.push('<div><span class="muted">Token</span> <code>' + escapeHtml(tok) + '</code></div>');
    }catch(_){}
    const id = String(part.idRaw ?? part.idraw ?? '').trim();
    if (id) lines.push('<div><span class="muted">ID</span> <code>' + escapeHtml(id) + '</code></div>');
    const code = normCode(part.code);
    if (code) lines.push('<div><span class="muted">Spawn</span> <code>' + escapeHtml(code) + '</code></div>');
    if (part.manufacturer) lines.push('<div><span class="muted">Mfr</span> ' + escapeHtml(String(part.manufacturer)) + '</div>');
    if (part.partType) lines.push('<div><span class="muted">Part type</span> ' + escapeHtml(String(part.partType)) + '</div>');
    lines.push('</div>');
    return lines.join('');
  }

  /** Rich preview HTML for the slot under the dropdown (IDs, codes, stats) — complements long option labels. */
  function formatPartPreviewHtml(part){
    if (!part) return '';
    const lines = [];
    const name = displayForPart(part);
    if (name) lines.push('<div class="stx-part-preview__title">' + escapeHtml(name) + '</div>');
    try{
      const tok = tokenForPart(part);
      if (tok) lines.push('<div><span class="muted">Token</span> <code>' + escapeHtml(tok) + '</code></div>');
    }catch(_){}
    const id = String(part.idRaw ?? part.idraw ?? '').trim();
    if (id) lines.push('<div><span class="muted">ID</span> <code>' + escapeHtml(id) + '</code></div>');
    const code = normCode(part.code);
    if (code) lines.push('<div><span class="muted">Spawn</span> <code>' + escapeHtml(code) + '</code></div>');
    if (part.manufacturer) lines.push('<div><span class="muted">Mfr</span> ' + escapeHtml(String(part.manufacturer)) + '</div>');
    if (part.partType) lines.push('<div><span class="muted">Part type</span> ' + escapeHtml(String(part.partType)) + '</div>');
    const statsRaw = part.stats != null ? String(part.stats) : '';
    const stats = statsRaw.replace(/\s+/g, ' ').trim();
    if (stats) lines.push('<div><span class="muted">Stats</span> ' + escapeHtml(stats.length > 520 ? stats.slice(0, 519) + '…' : stats) + '</div>');
    const ef = String(part.effects ?? part.effect ?? '').trim();
    if (ef) lines.push('<div><span class="muted">Effect</span> ' + escapeHtml(ef.length > 360 ? ef.slice(0, 359) + '…' : ef) + '</div>');
    let tip = '';
    try{
      if (typeof window.partTooltipText === 'function'){
        tip = String(window.partTooltipText(part) || '').trim();
      }
    }catch(_){}
    if (tip && tip.length > 12){
      const clipped = tip.length > 520 ? tip.slice(0, 519) + '…' : tip;
      const n = String(name || '').trim();
      const tipRedundant = n && (clipped === n || (clipped.startsWith(n) && clipped.length < n.length + 25));
      if (!tipRedundant) lines.push('<div class="small muted" style="margin-top:6px;opacity:.92;">' + escapeHtml(clipped) + '</div>');
    }
    return lines.join('');
  }

  function syncMainPartPreview(){
    const el = document.getElementById('stxMainPartPreview');
    if (!el) return;
    const sel = $('mainPart');
    if (!sel){
      el.innerHTML = '';
      return;
    }
    if (sel.disabled){
      const ph = (sel.options && sel.options[0]) ? String(sel.options[0].textContent || '').trim() : '';
      el.innerHTML = '<span class="muted">' + escapeHtml(ph || 'Complete the steps above first.') + '</span>';
      return;
    }
    const k = sel.value;
    const map = state.__mainPartByOptionKey;
    const p = (k && map && typeof map.get === 'function') ? map.get(k) : null;
    if (!k || !p){
      el.innerHTML = '<span class="muted">Select a main / prefix part to see token, IDs, spawn code, and stats.</span>';
      return;
    }
    if (p.__isAicarFullItem && p.__fullDeserialized){
      const fs = String(p.__fullDeserialized || '').trim();
      el.innerHTML = '<div class="stx-part-preview__title">' + escapeHtml(displayForPart(p)) + '</div>'
        + '<div class="small muted" style="margin-bottom:6px;">Full deserialized payload (trimmed)</div>'
        + '<code>' + escapeHtml(fs.length > 900 ? fs.slice(0, 899) + '…' : fs) + '</code>';
      return;
    }
    el.innerHTML = formatPartPreviewHtml(p);
  }

  function buildSlotControl(schemaItem, category){
    const slot = document.createElement('div');
    slot.className = 'slot';

    const top = document.createElement('div');
    top.className = 'top';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = schemaItem.label;

    const btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.textContent = 'Clear';
    btnClear.className = 'danger';
    btnClear.style.padding = '7px 10px';
    btnClear.addEventListener('click', ()=>{
      delete state.slots[schemaItem.key];
      refreshBuilder();
    });

    top.appendChild(name);
    top.appendChild(btnClear);

    // Stable retrieval: attach index to objects
    const all = getAllParts();
    for (let i=0;i<all.length;i++) all[i].__idx = i;

    let rawOpts = [];
    const isShieldType1ElementSlot = (category === 'Shield' && schemaItem && schemaItem.customType === 'type1Element');
    const isClassModElementSlot = (category === 'Class Mod' && schemaItem && schemaItem.customType === 'classModElement');
    const isShieldBodyLegendarySlot = (category === 'Shield' && schemaItem && schemaItem.key === 'bodyLegendary');
    const isShieldMainBodySlot = (category === 'Shield' && schemaItem && schemaItem.key === 'mainBody');
    if (isShieldType1ElementSlot){
      rawOpts = ELEMENTS
        .filter(e => e && e.code)
        .map(e => {
          const m = String(e.code || '').match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
          const fam = m ? Number(m[1]) : null;
          const id = m ? Number(m[2]) : null;
          return {
            category: 'Shield',
            manufacturer: state.manufacturer || '',
            partType: 'TypeID1Element',
            name: e.label,
            code: String(e.code || '').trim(),
            idRaw: (Number.isFinite(fam) && Number.isFinite(id)) ? `${fam}:${id}` : '',
            family: Number.isFinite(fam) ? fam : null,
            id: Number.isFinite(id) ? id : null
          };
        })
        .sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
    } else if (isClassModElementSlot){
      rawOpts = CLASSMOD_ELEMENT_OVERRIDES
        .filter(e => e && e.code)
        .map(e => {
          const m = String(e.code || '').match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
          const fam = m ? Number(m[1]) : null;
          const id = m ? Number(m[2]) : null;
          return {
            category: 'Character',
            manufacturer: state.manufacturer || '',
            partType: 'Element',
            name: e.label,
            code: String(e.code || '').trim(),
            idRaw: (Number.isFinite(fam) && Number.isFinite(id)) ? `${fam}:${id}` : '',
            family: Number.isFinite(fam) ? fam : null,
            id: Number.isFinite(id) ? id : null
          };
        })
        .sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
    } else if (category === 'Weapon' && schemaItem && schemaItem.customType === 'weaponPearl'){
      rawOpts = getAllParts().filter(p => {
        if (!p || String(p.category||'').trim() !== 'Weapon') return false;
        const c = String((p && p.code) ? p.code : '').trim();
        if (/^\{\s*27\s*:\s*\d+\s*\}$/.test(c)) return false;
        return /part_pearl/i.test(normCode(p.code));
      }).sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
    } else {
      const manufacturerForSlot = (isShieldBodyLegendarySlot || isShieldMainBodySlot) ? '' : state.manufacturer;
      const partTypeForSlot = (category === 'Shield' && (isShieldBodyLegendarySlot || isShieldMainBodySlot))
        ? undefined
        : schemaItem.partType;
      rawOpts = filterParts({
        category,
        manufacturer: manufacturerForSlot,
        weaponType: (category==='Weapon' ? state.weaponType : ''),
        partType: partTypeForSlot
      }).sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
      if (category === 'Weapon' && schemaItem && schemaItem.ncsSlot){
        rawOpts = applyWeaponNcsSlotOptionFilter(schemaItem.ncsSlot, rawOpts);
      }
      if (isShieldMainBodySlot && !rawOpts.length){
        rawOpts = filterParts({
          category,
          manufacturer: '',
          weaponType: '',
          partType: ''
        }).sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
      }
      if (category === 'Class Mod' && schemaItem && schemaItem.partType === 'Name+Skin'){
        // Keep Prefix Part aligned with the main page classmod name list (legacy per-class pools).
        const legacyNameOpts = getLegacyClassModNameParts(state.manufacturer)
          .sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
        if (legacyNameOpts.length > rawOpts.length) rawOpts = legacyNameOpts;
        if (rawOpts.length <= 1){
          // In some builds legacy classmod pools load later; retry after merging them.
          try{ mergeLegacyClassModPartsIntoAllParts(); }catch(_e){}
          const retry = filterParts({
            category,
            manufacturer: state.manufacturer,
            weaponType: '',
            partType: schemaItem.partType
          }).sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
          if (retry.length > rawOpts.length) rawOpts = retry;
        }
      }
      if (category === 'Class Mod' && schemaItem && schemaItem.partType === 'Skill'){
        // Match main classmod builder: class-specific skill pool from the selected character.
        const legacySkillOpts = getLegacyClassModSkillParts(state.manufacturer)
          .sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
        if (legacySkillOpts.length) rawOpts = legacySkillOpts;
      }
    }

    // Keep "Legendary ID" / Rarity slot aligned with the selected left-side rarity tier.
    if (schemaItem.partType === 'Rarity' && rarityTierFilterActiveForCurrentContext()){
      const selTier = getSelectedRarityTier();
      if (Number.isFinite(selTier)){
        const rr = getRarityRowsForCurrentContext()
          .filter(r => rarityTierFromItemTypeString(r && r.itemTypeString, r) === selTier);
        const famSet = new Set(rr.map(r => Number(r && r.familyId)).filter(n => Number.isFinite(n)));
        const itemSet = new Set(rr.map(r => Number(r && r.itemId)).filter(n => Number.isFinite(n)));
        rawOpts = rawOpts.filter(p => {
          const pf = partFamilyIdOf(p);
          const pi = partItemIdOf(p);
          const famOk = !famSet.size || famSet.has(pf);
          const itemOk = !itemSet.size || itemSet.has(pi);
          return famOk && itemOk;
        });

        // Weapon pearlescent override picker:
        // keep this slot strictly on pearl rarity IDs (51-60), and synthesize them if dataset rows are missing.
        if (category === 'Weapon' && Number(selTier) === 5){
          const isPearlRarityOpt = (p)=>{
            const code = String(normCode(p && p.code || '') || '').toLowerCase();
            const item = partItemIdOf(p);
            const pt = String((p && p.partType) || '').trim().toLowerCase();
            const catL = String((p && p.category) || '').trim().toLowerCase();
            const pearlCode = code.includes('pearl_') || /(?:^|[._])comp_06_pearlescent/.test(code);
            const pearlId = Number.isFinite(item) && item >= 51 && item <= 60;
            const rarityLike = (pt === 'rarity') || (catL === 'rarity');
            return pearlId || (rarityLike && pearlCode);
          };
          rawOpts = rawOpts.filter(isPearlRarityOpt);
          if (!rawOpts.length){
            const synthMan = String(state.manufacturer || '').trim();
            const synthType = String(state.weaponType || '').trim() || 'Weapon';
            rawOpts = PEARL_FALLBACK_ROWS.map(pr => ({
              category: 'Rarity',
              manufacturer: synthMan,
              itemType: synthType,
              weaponType: synthType,
              partType: 'Rarity',
              name: String(pr.legendaryName || pr.itemTypeString || `Pearlescent ${pr.itemId}`),
              code: `{1:${Number(pr.itemId)}}`,
              idRaw: `1:${Number(pr.itemId)}`,
              family: 1,
              id: Number(pr.itemId)
            }));
          }
        }
      }
    }

    // Shield slot filtering:
    // Keep options aligned to the selected family/manufacturer and enforce slot-specific
    // pools (body/246 perks/237 armor/248 energy/type1 element).
    if (category === 'Shield' && !isShieldType1ElementSlot){
      const parseFamFromRaritySel = (v)=>{
        const s = String(v || '').trim();
        if (!s || s.indexOf('|') === -1) return null;
        const fam = Number(s.split('|')[0]);
        return Number.isFinite(fam) ? fam : null;
      };
      const partFam = (p)=>{
        if (p && p.family != null && Number.isFinite(Number(p.family))) return Number(p.family);
        if (p && p.familyId != null && Number.isFinite(Number(p.familyId))) return Number(p.familyId);
        const idRaw = String((p && (p.idRaw || p.idraw)) || '').trim();
        const m = idRaw.match(/^(\d+)\s*:/);
        return m ? Number(m[1]) : null;
      };
      const selectedFam = (() => {
        const fromRarity = parseFamFromRaritySel(state.rarity || ($('rarity') && $('rarity').value) || '');
        if (fromRarity != null) return fromRarity;
        return partFam(state.mainPart || null);
      })();
      const manL = String(state.manufacturer || '').trim().toLowerCase();
      const useAllMfr = isAllPartsEnabled();
      const slotKey = String(schemaItem && schemaItem.key || '');
      const ignoreMfrForBodyLegendary = (slotKey === 'bodyLegendary' || slotKey === 'mainBody');

      rawOpts = rawOpts.filter((p)=>{
        const pm = String((p && p.manufacturer) || '').trim().toLowerCase();
        const pf = partFam(p);
        const isGenericMan = (pm === '' || pm === 'gadgets' || pm === 'generic' || pm === 'all' || pm === 'universal');
        if (!useAllMfr && !ignoreMfrForBodyLegendary && manL && pm && !isGenericMan && pm !== manL) return false;
        if (pf == null) return false;

        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        const isRarityPart = (pt === 'rarity') || /(^|[._])(comp_0[1-5]_|pearl_)/.test(code) || code.includes('.comp_');
        const isPerk = (pt === 'perk');
        const isFirmware = (pt === 'firmware');

        if (slotKey === 'mainBody'){
          if (pf === 246 || pf === 237 || pf === 248) return false;
          if (isRarityPart || isPerk || isFirmware) return false;
          if (Number.isFinite(selectedFam) && pf !== selectedFam) return false;
          return true;
        }

        if (slotKey === 'bodyLegendary'){
          if (!Number.isFinite(pf)) return false;
          if (pf === 246 || pf === 237 || pf === 248) return false;
          if (isRarityPart || isPerk || isFirmware) return false;
          return true;
        }

        if (slotKey === 'resistance'){
          if (pf !== 246) return false;
          if (isRarityPart || isPerk || isFirmware) return false;
          return true;
        }

        if (slotKey === 'primary246'){
          if (pf !== 246) return false;
          if (!isPerk) return false;
          return code.includes('_primary');
        }

        if (slotKey === 'secondary246'){
          if (pf !== 246) return false;
          if (!isPerk) return false;
          // Secondary bucket also catches generic perk rows that are not explicitly marked primary.
          return !code.includes('_primary');
        }

        if (slotKey === 'armor237') return pf === 237;
        if (slotKey === 'energy248') return pf === 248;
        if (slotKey === 'firmware246') return pf === 246 && isFirmware;

        if (!useAllMfr && Number.isFinite(selectedFam)){
          if (pf === selectedFam) return true;
          if (pf === 237 || pf === 246 || pf === 248) return true;
          return false;
        }
        return true;
      });
    }

    // Enhancement compatibility:
    // Build robust slot pools because Enhancement datasets often mix partType labels.
    if (category === 'Enhancement'){
      const slotKey = String(schemaItem && schemaItem.key || '').trim().toLowerCase();
      const allEnhancement = () => filterParts({
        category,
        manufacturer: state.manufacturer,
        weaponType: '',
        partType: undefined
      });
      const sortParts = (arr)=>arr.sort((a,b)=>displayForPart(a).localeCompare(displayForPart(b), undefined, {numeric:true, sensitivity:'base'}));
      const isRarityish = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        return (
          pt === 'rarity' ||
          pt === 'secondary rarity' ||
          pt === 'rarity components' ||
          /(^|[._])(comp_0[1-5]_|pearl_)/.test(code) ||
          code.includes('.comp_') ||
          code.includes('enhancement.comp_')
        );
      };
      const isCoreLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        return pt === 'core' || code.includes('part_core_') || code.includes('.part_core_');
      };
      const isStatsLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        return pt === 'stats' || pt === 'stat' || /^stats?\s*[23]$/.test(pt) || code.includes('part_stat');
      };
      const isFirmwareLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        return pt === 'firmware' || code.includes('part_firmware');
      };
      const isElementLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        return (
          pt === 'status' ||
          pt === 'element' ||
          pt === 'elemental' ||
          /(?:^|[._])part_ele(?:[._]|$)/.test(code) ||
          /(?:^|[._])part_(fire|cryo|shock|corrosive|radiation)(?:[._]|$)/.test(code) ||
          /(?:^|[._])(element|ele)(?:[._]|$)/.test(code)
        );
      };
      const isLegendaryLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        if (isRarityish(p)) return false;
        if (pt === 'legendary perks' || pt === 'legendary perk' || pt === 'legendary') return true;
        if (code.includes('legendary') || code.includes('unique_core')) return true;
        return isCoreLike(p);
      };
      const isBodyLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        if (pt === 'body' || pt === 'main body') return true;
        return code.includes('part_body_') || code.includes('.part_body_');
      };
      const isSpecialLike = (p)=>{
        const pt = String((p && p.partType) || '').trim().toLowerCase();
        const code = String((p && p.code) || '').trim().toLowerCase();
        if (isRarityish(p) || isCoreLike(p) || isStatsLike(p) || isFirmwareLike(p) || isLegendaryLike(p) || isElementLike(p) || isBodyLike(p)) return false;
        if (pt === 'special' || pt === 'unique' || pt === '') return true;
        if (code.includes('part_unique') || code.includes('.part_unique_') || code.includes('unique_')) return true;
        return false;
      };

      if (slotKey === 'body'){
        rawOpts = sortParts(allEnhancement().filter((p)=>{
          if (isRarityish(p) || isCoreLike(p) || isStatsLike(p) || isFirmwareLike(p) || isLegendaryLike(p) || isElementLike(p)) return false;
          return isBodyLike(p);
        }));
      } else if (slotKey === 'rarity'){
        rawOpts = sortParts(allEnhancement().filter((p)=>isRarityish(p)));
      } else if (slotKey === 'stats'){
        rawOpts = sortParts(allEnhancement().filter((p)=>isStatsLike(p) && !isRarityish(p)));
      } else if (slotKey === 'legendary' || slotKey === 'legendary2'){
        rawOpts = sortParts(allEnhancement().filter((p)=>isLegendaryLike(p)));
      } else if (slotKey === 'special'){
        rawOpts = sortParts(allEnhancement().filter((p)=>isSpecialLike(p)));
      } else if (slotKey === 'firmware'){
        rawOpts = sortParts(allEnhancement().filter((p)=>isFirmwareLike(p) && !isRarityish(p)));
      } else if (slotKey === 'element'){
        rawOpts = sortParts(allEnhancement().filter((p)=>isElementLike(p) && !isRarityish(p)));
        if (!rawOpts.length){
          // Enhancement datasets often omit dedicated element rows; keep slot usable.
          rawOpts = ELEMENTS
            .filter(e => e && e.key !== 'None' && e.code)
            .map(e => {
              const m = String(e.code || '').match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
              const fam = m ? Number(m[1]) : null;
              const id = m ? Number(m[2]) : null;
              return {
                category: 'Enhancement',
                manufacturer: state.manufacturer || '',
                partType: 'Status',
                name: e.label,
                code: String(e.code || '').trim(),
                idRaw: (Number.isFinite(fam) && Number.isFinite(id)) ? `${fam}:${id}` : '',
                family: Number.isFinite(fam) ? fam : null,
                id: Number.isFinite(id) ? id : null
              };
            });
        }
      }
    }
    // Dataset can contain duplicate rows for the same logical part.
    // Keep one entry per unique idRaw/code/partType per slot list.
    const seenOptKeys = new Set();
    const opts = rawOpts.filter((p)=>{
      const key = [
        String((p && (p.idRaw != null ? p.idRaw : p.id)) || '').trim(),
        normCode(p && p.code),
        String((p && p.partType) || '').trim()
      ].join('|');
      if (seenOptKeys.has(key)) return false;
      seenOptKeys.add(key);
      return true;
    });

    const picked = document.createElement('div');
    picked.className = 'picked';

    function renderPicked(){
      if (!showInlinePicked) return;
      const cur = state.slots[schemaItem.key];
      if (schemaItem.multi){
        const arr = Array.isArray(cur) ? cur : [];
        picked.innerHTML = arr.length
          ? `<div>${arr.map(p=>`* ${escapeHtml(displayForPart(p))}<br><code>${escapeHtml(tokenForPart(p))}</code>`).join('<br>')}</div>`
          : `<div class="muted small">Nothing selected.</div>`;
      } else {
        picked.innerHTML = cur
          ? `<div>${escapeHtml(displayForPart(cur))}<br><code>${escapeHtml(tokenForPart(cur))}</code></div>`
          : `<div class="muted small">Nothing selected.</div>`;
      }
    }

    // Tickbox selectors (searchable) for large pools.
    const useTickPicker = (
      ((category === 'Class Mod') && (
        schemaItem.partType === 'Name+Skin' ||
        schemaItem.partType === 'Rarity' ||
        schemaItem.partType === 'Skill' ||
        schemaItem.partType === 'Universal' ||
        schemaItem.partType === 'Secondary' ||
        schemaItem.partType === 'Firmware' ||
        schemaItem.partType === 'Perk'
      )) ||
      ((category === 'Enhancement') && (
        schemaItem.key === 'stats' ||
        schemaItem.key === 'legendary' ||
        schemaItem.key === 'legendary2' ||
        schemaItem.key === 'special' ||
        schemaItem.key === 'element'
      ))
    );
    const showInlinePicked = !(category === 'Class Mod' && useTickPicker);

    slot.appendChild(top);

    if (useTickPicker){
      const wrap = document.createElement('div');
      wrap.style.marginTop = '6px';

      const search = document.createElement('input');
      search.type = 'text';
      search.id = 'stx-tick-search-' + (schemaItem.key || 'filter');
      search.name = search.id;
      search.setAttribute('aria-label', 'Filter parts');
      search.placeholder = 'Filter...';
      search.style.width = '100%';
      search.style.padding = '10px';
      search.style.borderRadius = '10px';
      search.style.border = '1px solid rgba(255,255,255,0.14)';
      search.style.background = '#0b0f18';
      search.style.color = '#d8ffff';
      search.style.marginBottom = '8px';

      const list = document.createElement('div');
      list.style.maxHeight = '260px';
      list.style.overflow = 'auto';
      list.style.border = '1px solid rgba(255,255,255,0.10)';
      list.style.borderRadius = '12px';
      list.style.padding = '6px';
      list.style.background = 'rgba(0,0,0,0.18)';

      function isSelected(part){
        const cur = state.slots[schemaItem.key];
        const tok = tokenForPart(part);
        if (schemaItem.multi){
          const arr = Array.isArray(cur) ? cur : [];
          return arr.some(x => tokenForPart(x) === tok);
        }
        return cur && tokenForPart(cur) === tok;
      }

      function setSelected(part, checked){
        if (schemaItem.multi){
          const cur = state.slots[schemaItem.key];
          const arr = Array.isArray(cur) ? cur.slice() : [];
          const tok = tokenForPart(part);
          const has = arr.some(x => tokenForPart(x) === tok);
          if (checked && !has) arr.push(part);
          if (!checked && has){
            for (let i=arr.length-1;i>=0;i--){
              if (tokenForPart(arr[i]) === tok) arr.splice(i,1);
            }
          }
          state.slots[schemaItem.key] = arr;
        } else {
          state.slots[schemaItem.key] = checked ? part : null;
          if (!checked) delete state.slots[schemaItem.key];
        }
      }

      function renderList(){
        const q = String(search.value || '').trim().toLowerCase();
        let listSrc = opts;
        if (q){
          listSrc = opts.filter(p=>{
            const label = String(displayForPart(p) || '').toLowerCase();
            const code  = String(p && p.code ? p.code : '').toLowerCase();
            return label.includes(q) || code.includes(q);
          });
        } else {
          listSrc = opts.slice(0, 500);
        }

        list.innerHTML = '';
        if (!listSrc.length){
          const empty = document.createElement('div');
          empty.className = 'muted small';
          empty.style.padding = '8px';
          empty.textContent = 'No matches.';
          list.appendChild(empty);
          return;
        }

        const groupName = `tick_${schemaItem.key}_${Math.random().toString(16).slice(2)}`;

        listSrc.forEach((part, idx) => {
          const row = document.createElement('label');
          row.className = 'stx-tick-row';
          row.style.display = 'flex';
          row.style.gap = '10px';
          row.style.alignItems = 'flex-start';
          row.style.padding = '6px 8px';
          row.style.borderRadius = '10px';
          row.style.cursor = 'pointer';
          row.style.userSelect = 'none';
          row.style.pointerEvents = 'auto';

          const input = document.createElement('input');
          input.type = schemaItem.multi ? 'checkbox' : 'radio';
          input.id = 'tick-' + (schemaItem.key || 'part') + '-' + idx;
          input.name = schemaItem.multi ? input.id : groupName;
          input.style.marginTop = '3px';
          input.checked = isSelected(part);
          input.style.pointerEvents = 'auto';

          const text = document.createElement('div');
          text.style.flex = '1';
          const line1 = document.createElement('div');
          line1.textContent = displayForPart(part);
          const line2 = document.createElement('div');
          line2.className = 'muted small';
          line2.textContent = tokenForPart(part);
          text.appendChild(line1);
          text.appendChild(line2);

          input.addEventListener('change', ()=>{
            if (!schemaItem.multi){
              // Clear previous selection
              setSelected(part, true);
              // Ensure only one selected: rerender the list to update other radios
              renderPicked();
              refreshOutputs();
              renderList();
              return;
            }
            setSelected(part, input.checked);
            renderPicked();
            refreshOutputs();
          });

          row.appendChild(input);
          row.appendChild(text);
          list.appendChild(row);
        });
      }

      search.addEventListener('input', ()=>window.requestAnimationFrame(renderList));

      wrap.appendChild(search);
      wrap.appendChild(list);
      slot.appendChild(wrap);

      renderList();
      if (showInlinePicked){
        renderPicked();
        slot.appendChild(picked);
      }
      return slot;
    }

    // Default dropdown-based selector for all other categories/slots.
    const sel = document.createElement('select');
    sel.id = 'stx-sel-' + (schemaItem.key || category || 'part');
    sel.name = sel.id;
    sel.setAttribute('aria-label', schemaItem.label || schemaItem.key || 'Select part');
    const isShieldSimpleSlot = (category === 'Shield');
    const partByOptionKey = new Map();
    for (let i=0; i<opts.length; i++){
      const p = opts[i];
      const key = (p && p.__idx != null && Number.isFinite(Number(p.__idx)))
        ? `idx:${Number(p.__idx)}`
        : `local:${i}`;
      partByOptionKey.set(key, p);
      try{ p.__slotOptKey = key; }catch(_e){}
    }
    const barrelSlot = isBarrelFamilySchemaSlot(schemaItem, category);
    setSelectOptions(sel, opts, {
      placeholder: isShieldSimpleSlot
        ? 'Select a part to add...'
        : (schemaItem.multi ? '(add one or more...)' : '(optional)'),
      getLabel: barrelSlot ? barrelFamilyDropdownLabelCompact : dropdownLabelCompactForPart,
      getValue: (p)=>String((p && p.__slotOptKey) ? p.__slotOptKey : ''),
      getTitle: barrelSlot ? barrelFamilyOptionTitle : null,
      decorateOption: (opt, p)=>{ stxApplySlotPartOptionDecoration(opt, p, schemaItem, category); }
    });
    slot.appendChild(sel);

    const partPreview = document.createElement('div');
    partPreview.className = 'stx-part-preview small';
    partPreview.setAttribute('role', 'status');
    partPreview.setAttribute('aria-live', 'polite');
    function syncPartPreview(){
      const k = sel.value;
      const p = k ? partByOptionKey.get(k) : null;
      const barrelish = !!(p && isBarrelFamilySchemaSlot(schemaItem, category));
      partPreview.classList.toggle('stx-part-preview--barrel', barrelish);
      if (!p){
        partPreview.classList.remove('stx-part-preview--barrel');
        partPreview.innerHTML = '<span class="muted">Select a part above to see token, IDs, spawn code, and stats.</span>';
        return;
      }
      partPreview.innerHTML = barrelish ? formatBarrelFamilyPartPreviewHtml(p) : formatPartPreviewHtml(p);
    }
    sel.addEventListener('change', syncPartPreview);
    syncPartPreview();
    slot.appendChild(partPreview);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = isShieldSimpleSlot ? 'Add' : (schemaItem.multi ? 'Add' : 'Set');
    addBtn.className = 'primary';
    addBtn.style.marginTop = isShieldSimpleSlot ? '0' : '8px';

    let qtyInput = null;
    if (isShieldSimpleSlot){
      qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.id = 'stx-qty-' + (schemaItem.key || 'shield');
      qtyInput.name = `qty_${schemaItem.key}`;
      qtyInput.min = '1';
      qtyInput.step = '1';
      qtyInput.value = '1';
      qtyInput.inputMode = 'numeric';
      qtyInput.setAttribute('aria-label', 'Quantity');
      qtyInput.style.width = '72px';
      qtyInput.style.padding = '9px 10px';
      qtyInput.style.borderRadius = '10px';
      qtyInput.style.border = '1px solid rgba(255,255,255,0.16)';
      qtyInput.style.background = '#0b0f18';
      qtyInput.style.color = '#d8ffff';
      qtyInput.style.fontWeight = '700';
    }
    let swapPerkInput = null;
    if (isShieldBodyLegendarySlot){
      swapPerkInput = document.createElement('input');
      swapPerkInput.type = 'checkbox';
      swapPerkInput.id = 'stxSwapBodyLegendary';
      swapPerkInput.name = 'stxSwapBodyLegendary';
      swapPerkInput.checked = !!state.swapBodyLegendary;
      swapPerkInput.style.margin = '0';
      swapPerkInput.style.width = '16px';
      swapPerkInput.style.height = '16px';
      swapPerkInput.addEventListener('change', ()=>{
        state.swapBodyLegendary = !!swapPerkInput.checked;
        if (state.swapBodyLegendary){
          const cur = state.slots.bodyLegendary;
          if (Array.isArray(cur) && cur.length > 1){
            state.slots.bodyLegendary = [cur[cur.length - 1]];
            refreshBuilder();
            return;
          }
        }
        refreshOutputs();
      });
    }

    addBtn.addEventListener('click', ()=>{
      const key = sel.value;
      if (!key) return;
      const part = partByOptionKey.get(key);
      if (!part) return;
      const count = qtyInput ? Math.max(1, Number(qtyInput.value || 1) || 1) : 1;

      if (schemaItem.multi){
        const swapBodyLegendary = (isShieldBodyLegendarySlot && !!state.swapBodyLegendary);
        const arr = Array.isArray(state.slots[schemaItem.key]) ? state.slots[schemaItem.key].slice() : [];
        const tok = tokenForPart(part);
        if (swapBodyLegendary){
          state.slots[schemaItem.key] = [part];
        } else {
          for (let i=0; i<count; i++){
            if (!arr.some(x => tokenForPart(x) === tok)) arr.push(part);
          }
          state.slots[schemaItem.key] = arr;
        }
      } else {
        state.slots[schemaItem.key] = part;
      }
      sel.value = '';
      refreshBuilder();
    });

    if (isShieldSimpleSlot && qtyInput){
      const actionRow = document.createElement('div');
      actionRow.className = 'row';
      actionRow.style.marginTop = '8px';
      actionRow.style.alignItems = 'center';
      actionRow.appendChild(qtyInput);
      actionRow.appendChild(addBtn);
      slot.appendChild(actionRow);
      if (swapPerkInput){
        const swapRow = document.createElement('label');
        swapRow.className = 'row';
        swapRow.style.display = 'inline-flex';
        swapRow.style.marginTop = '6px';
        swapRow.style.alignItems = 'center';
        swapRow.style.gap = '4px';
        swapRow.style.cursor = 'pointer';
        swapRow.style.pointerEvents = 'auto';
        swapPerkInput.style.pointerEvents = 'auto';
        swapRow.appendChild(swapPerkInput);
        const swapText = document.createElement('span');
        swapText.textContent = '- Swap perk';
        swapText.className = 'small';
        swapText.style.fontWeight = '700';
        swapText.style.color = '#9de8ff';
        swapText.style.pointerEvents = 'auto';
        swapRow.appendChild(swapText);
        slot.appendChild(swapRow);
      }
    } else {
      slot.appendChild(addBtn);
    }
    renderPicked();
    slot.appendChild(picked);
    return slot;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function buildElementsControl(){
    const wrap = document.createElement('div');
    wrap.className = 'slot';

    const top = document.createElement('div');
    top.className='top';
    const name = document.createElement('div');
    name.className='name';
    name.textContent = 'Elements (stackable)';

    const clearBtn = document.createElement('button');
    clearBtn.type='button';
    clearBtn.className='danger';
    clearBtn.style.padding='7px 10px';
    clearBtn.textContent='Clear';
    clearBtn.addEventListener('click', ()=>{
      state.primaryElement = 'None';
      state.elementStack = [];
      refreshBuilder();
    });

    top.appendChild(name);
    top.appendChild(clearBtn);

    const primary = document.createElement('select');
    primary.id = 'stxPrimaryElement';
    primary.name = primary.id;
    primary.setAttribute('aria-label', 'Primary element');
    setSelectOptions(primary, ELEMENTS, {
      placeholder:'Primary element...',
      getLabel: stxPresetElementDropdownLabel,
      getValue:(e)=>e.key,
      getTitle: (e) => (e && e.code) ? ('Output token: ' + String(e.code)) : ''
    });
    primary.value = state.primaryElement || 'None';
    primary.addEventListener('change', ()=>{
      state.primaryElement = primary.value || 'None';
      refreshOutputs();
    });

    const row = document.createElement('div');
    row.className='row';
    row.style.marginTop='10px';

    const addSel = document.createElement('select');
    addSel.id = 'stxAddElement';
    addSel.name = addSel.id;
    addSel.setAttribute('aria-label', 'Add element to stack');
    setSelectOptions(addSel, ELEMENTS.filter(e=>e.key!=='None'), {
      placeholder:'Add element...',
      getLabel: stxPresetElementDropdownLabel,
      getValue:e=>e.key,
      getTitle: (e) => (e && e.code) ? ('Output token: ' + String(e.code)) : ''
    });

    const addBtn = document.createElement('button');
    addBtn.type='button';
    addBtn.className='primary';
    addBtn.textContent='Add';
    addBtn.style.width='100%';
    addBtn.addEventListener('click', ()=>{
      const v = addSel.value;
      if (!v) return;
      state.elementStack.push(v);
      addSel.value='';
      refreshBuilder();
    });

    row.appendChild(addSel);
    row.appendChild(addBtn);

    const picked = document.createElement('div');
    picked.className='picked';
    const primaryLine = `<div><span class="muted">Primary:</span> <b>${escapeHtml(state.primaryElement || 'None')}</b></div>`;
    const stackLine = state.elementStack.length
      ? `<div style="margin-top:6px"><span class="muted">Stack:</span><br>${state.elementStack.map((e,i)=>`* ${escapeHtml(e)} <button data-idx="${i}" style="margin-left:8px;padding:2px 8px;border-radius:10px">remove</button>`).join('<br>')}</div>`
      : `<div style="margin-top:6px" class="muted small">No stacked elements yet. Add the same element again to stack it.</div>`;
    picked.innerHTML = primaryLine + stackLine;

    picked.querySelectorAll('button[data-idx]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = Number(btn.getAttribute('data-idx'));
        state.elementStack.splice(i,1);
        refreshBuilder();
      });
    });

    wrap.appendChild(top);
    wrap.appendChild(primary);
    wrap.appendChild(row);
    wrap.appendChild(picked);

    const note = document.createElement('div');
    note.className='small muted';
    note.style.marginTop='8px';
    note.textContent = 'Dual-elements (Maliwan-style) are represented as Primary + at least one additional stacked element.';
    wrap.appendChild(note);

    return wrap;
  }

  function refreshBuilder(){
    const builder = $('builder');
    builder.innerHTML = '';

    const mainKey = String($('mainPart').value || '').trim();
    if (!mainKey){
      const directMain = state.mainPart || null;
      const directType = String((directMain && directMain.partType) || '').trim().toLowerCase();
      const directCat = String(state.itemType || state.detectedCategory || '').trim();
      if (directMain && directType === 'rarity' && /class\s*mod|classmod/i.test(directCat)) {
        state.detectedCategory = 'Class Mod';
        $('detectedCat').textContent = state.detectedCategory;
        $('builderEmpty').style.display = '';
        refreshOutputs();
        return;
      }
      state.mainPart = null;
      state.detectedCategory = null;
      $('detectedCat').textContent = '-';
      $('builderEmpty').style.display = '';
      refreshOutputs();
      return;
    }

    let main = null;
    try{
      const map = state && state.__mainPartByOptionKey;
      if (map && typeof map.get === 'function') main = map.get(mainKey) || null;
    }catch(_e){}
    if (!main && /^idx:\s*-?\d+$/i.test(mainKey)){
      const idx = Number(mainKey.replace(/^idx:\s*/i, ''));
      if (Number.isFinite(idx)) main = getAllParts()[idx] || null;
    }
    // Backward compatibility for old numeric-only values.
    if (!main && /^-?\d+$/.test(mainKey)){
      const idx = Number(mainKey);
      if (Number.isFinite(idx)) main = getAllParts()[idx] || null;
    }
    if (!main){
      state.mainPart = null;
      state.detectedCategory = null;
      $('detectedCat').textContent = '-';
      $('builderEmpty').style.display = '';
      refreshOutputs();
      return;
    }
    let guidedClassModActive = false;
    try {
      const gi = document.getElementById('ccGuidedItemType');
      guidedClassModActive = !!(gi && /class\s*mod|classmod/i.test(String(gi.value || '').trim()) && String(state.itemType || '').trim() === 'Class Mod');
    } catch (_) {}
    const checklistCompRarity = guidedClassModActive && state.mainPart && String(state.mainPart.partType || '').trim().toLowerCase() === 'rarity';
    if (checklistCompRarity) {
      main = state.mainPart;
    } else {
      state.mainPart = main;
    }
    state.detectedCategory = detectCategoryFromMainPart(main) || state.itemType;
    $('detectedCat').textContent = state.detectedCategory || '-';
    $('builderEmpty').style.display = 'none';

    const cat = state.detectedCategory;

    // Main part card
    const mainSlot = document.createElement('div');
    mainSlot.className = 'slot';
    const top = document.createElement('div');
    top.className='top';
    const name = document.createElement('div');
    name.className='name';
    var mainLabel = 'Rarity ID Part';
    if (String(cat || '').trim() === 'Class Mod') mainLabel = 'Body - Classmod Name';
    name.textContent = main.__isAicarFullItem ? 'Full item' : mainLabel;
    const change = document.createElement('div');
    change.className='muted small';
    change.textContent = main.__isAicarFullItem ? 'Complete deserialized serial (AI / car / guns).' : 'Selected in the left panel.';
    top.appendChild(name);
    top.appendChild(change);

    const picked = document.createElement('div');
    picked.className='picked';
    if (main.__isAicarFullItem && main.__fullDeserialized){
      picked.innerHTML = `<div>${escapeHtml(displayForPart(main))}<br><code>${escapeHtml(String(main.__fullDeserialized))}</code></div>`;
    } else {
      picked.innerHTML = `<div>${escapeHtml(displayForPart(main))}<br><code>${escapeHtml(tokenForPart(main))}</code></div>`;
    }
    mainSlot.appendChild(top);
    mainSlot.appendChild(picked);

    builder.appendChild(mainSlot);

    if (cat === 'Weapon'){
      const grid = document.createElement('div');
      grid.className = 'grid';

      // Weapon slots
      for (const s of getActiveWeaponSlotSchema()){
        grid.appendChild(buildSlotControl(s, 'Weapon'));
      }

      // Elements control
      grid.appendChild(buildElementsControl());

      builder.appendChild(grid);
    } else {
      const schema = SIMPLE_SCHEMA_BY_CATEGORY[cat] || [];
      const grid = document.createElement('div');
      grid.className='grid';
      for (const s of schema){
        grid.appendChild(buildSlotControl(s, cat));
      }
      builder.appendChild(grid);
    }

    refreshOutputs();
  }

  function computeOrderedParts(){
    const cat = state.detectedCategory;
    if (!cat || !state.mainPart) return [];
    if (state.mainPart.__fullDeserialized) return [];

    const out = [];
    // include main part first (prefix)
    out.push(state.mainPart);

    if (cat === 'Weapon'){
      const ordered = [];
      const pushIf = (p)=>{ if (p) ordered.push(p); };
      pushIf(state.mainPart);
      const schema = getActiveWeaponSlotSchema();
      for (const s of schema){
        if (s.multi && s.key === 'legendary'){
          if (Array.isArray(state.slots.legendary)){
            for (const p of state.slots.legendary) pushIf(p);
          }
          continue;
        }
        if (s.multi) continue;
        pushIf(state.slots[s.key]);
      }
      return ordered.filter(Boolean);
    } else {
      const schema = SIMPLE_SCHEMA_BY_CATEGORY[cat] || [];
      const ordered = [state.mainPart];
      // Guided class mod checklist: base comp rarity (main) + optional name + legendary/name rarity id — match cc-classmod-checklist-rebuild.js order.
      if (cat === 'Class Mod' && state.slots) {
        if (state.slots.namePart) ordered.push(state.slots.namePart);
        if (state.slots.rarityNamePart) ordered.push(state.slots.rarityNamePart);
      }
      for (const s of schema){
        const cur = state.slots[s.key];
        if (!cur) continue;
        if (s.multi){
          for (const p of (Array.isArray(cur)?cur:[])) ordered.push(p);
        } else {
          ordered.push(cur);
        }
      }
      return ordered;
    }
  }

  function computeOutputTokens(){
    if (typeof window.__ccIsScrollBusy === 'function' && window.__ccIsScrollBusy()) return { tokens: [], json: {} };
    const cat = state.detectedCategory;
    if (!cat || !state.mainPart) return {tokens:[], json:{}};
    if (state.mainPart.__fullDeserialized){
      const fs = String(state.mainPart.__fullDeserialized).trim();
      return {
        tokens: fs ? [fs] : [],
        json: {
          category: 'Other',
          manufacturer: state.manufacturer || 'AI Car Guns',
          fullItemDeserialized: fs,
          mode: 'fullItem'
        }
      };
    }

    const orderedParts = computeOrderedParts();
    const tokens = orderedParts.map(tokenForPart).filter(Boolean);

    // Append element tokens as plain strings (they are not dataset IDs/codes)
    if (cat === 'Weapon'){
      const elems = [];
      const prim = state.primaryElement || 'None';
      const primObj = ELEMENTS.find(x=>x.key===prim);
      if (primObj && primObj.code) elems.push(primObj.code);
      if (Array.isArray(state.elementStack) && state.elementStack.length){
        for (const e of state.elementStack){
          const eo = ELEMENTS.find(x=>x.key===e);
          if (eo && eo.code) elems.push(eo.code);
        }
      }
      tokens.push(...elems);
    }

    // Optional skin/camo selections from dropdowns
    if (cat === 'Weapon'){
      const sc = getSelectedWeaponSkinAndCamo();
      if (sc && sc.camoToken) tokens.push(sc.camoToken);
    }

    // extras (imported unknown tokens)
    if (Array.isArray(state.extras) && state.extras.length){
      tokens.push(...state.extras.map(String));
    }

    const jsonObj = {
      category: cat,
      manufacturer: state.manufacturer || '',
      weaponType: (cat==='Weapon') ? (state.weaponType || '') : '',
      level: Number(state.level || 1),
      main: state.mainPart ? {
        name: state.mainPart.name || '',
        code: normCode(state.mainPart.code),
        idRaw: String(state.mainPart.idRaw ?? ''),
        id: state.mainPart.id ?? null,
        partType: state.mainPart.partType || ''
      } : null,
      slots: {},
      elements: (cat==='Weapon') ? { primary: state.primaryElement || 'None', stack: state.elementStack.slice() } : undefined,
      extras: state.extras.slice(),
      mode: state.idMode ? 'idRaw' : 'code'
    };

    const base = getSelectedBaseItem();
    if (base) jsonObj.seed = getSeed(base);
    const scJson = (cat === 'Weapon') ? getSelectedWeaponSkinAndCamo() : null;
    if (scJson){
      if (scJson.skinRaw) jsonObj.skin = scJson.skinRaw;
      if (Number.isFinite(scJson.rarityId)) jsonObj.skinRarityId = Number(scJson.rarityId);
      if (scJson.rarityToken) jsonObj.skinRarityToken = String(scJson.rarityToken || '').trim();
      if (scJson.camoToken) jsonObj.camo = scJson.camoToken;
    }

    // serialize slots
    const addSlot = (k, v)=>{
      if (!v) return;
      if (Array.isArray(v)){
        jsonObj.slots[k] = v.map(p=>({
          name: p.name || '',
          code: normCode(p.code),
          idRaw: String(p.idRaw ?? ''),
          id: p.id ?? null,
          partType: p.partType || ''
        }));
      } else {
        jsonObj.slots[k] = {
          name: v.name || '',
          code: normCode(v.code),
          idRaw: String(v.idRaw ?? ''),
          id: v.id ?? null,
          partType: v.partType || ''
        };
      }
    };
    for (const k of Object.keys(state.slots)){
      addSlot(k, state.slots[k]);
    }

    return {tokens, json: jsonObj};
  }

  function getSelectedBaseItem(){
    const tier = getSelectedRarityTier();
    const useTierFilter = rarityTierFilterActiveForCurrentContext();
    const rows = getRarityRowsForCurrentContext()
      .filter(r => !useTierFilter || !Number.isFinite(tier) || rarityTierFromItemTypeString(r && r.itemTypeString, r) === tier);
    const famFromMain = partFamilyIdOf(state.mainPart || null);
    const mainPartType = String((state.mainPart && state.mainPart.partType) || '').trim().toLowerCase();
    const mainPartItemId = partItemIdOf(state.mainPart || null);
    if (mainPartType === 'rarity' && Number.isFinite(famFromMain) && Number.isFinite(mainPartItemId)){
      return { familyId: Number(famFromMain), itemId: Number(mainPartItemId) };
    }
    const raritySlotPartRaw = state && state.slots ? state.slots.rarity : null;
    const raritySlotPart = Array.isArray(raritySlotPartRaw) ? (raritySlotPartRaw[0] || null) : raritySlotPartRaw;
    const raritySlotIsRarity = String((raritySlotPart && raritySlotPart.partType) || '').trim().toLowerCase() === 'rarity';
    const raritySlotItemId = raritySlotIsRarity ? partItemIdOf(raritySlotPart || null) : null;
    const raritySlotFamilyId = raritySlotIsRarity ? partFamilyIdOf(raritySlotPart || null) : null;

    let pool = rows;
    if (Number.isFinite(famFromMain)){
      const byFam = rows.filter(r => Number(r && r.familyId) === Number(famFromMain));
      if (byFam.length) pool = byFam;
    }

    // Prefer the explicitly selected shield rarity slot item (e.g. {8} vs {7}).
    if (Number.isFinite(raritySlotItemId)){
      const bySlot = pool.filter(r => Number(r && r.itemId) === Number(raritySlotItemId));
      if (bySlot.length){
        return { familyId: Number(bySlot[0].familyId), itemId: Number(bySlot[0].itemId) };
      }
      if (Number.isFinite(raritySlotFamilyId)){
        return { familyId: Number(raritySlotFamilyId), itemId: Number(raritySlotItemId) };
      }
      if (Number.isFinite(famFromMain)){
        return { familyId: Number(famFromMain), itemId: Number(raritySlotItemId) };
      }
    }

    const pick = pool.find(r => !String(r && r.legendaryName || '').trim()) || pool[0] || null;
    if (pick){
      // Do not invent a default base from the first rarity row until the user selects a main/rarity part
      // (or a rarity slot part for shield-style layouts).
      if (!state.mainPart && !raritySlotIsRarity){
        return null;
      }
      return { familyId: Number(pick.familyId), itemId: Number(pick.itemId) };
    }
    if (Number.isFinite(famFromMain)){
      return { familyId: Number(famFromMain), itemId: null };
    }
    return null;
  }

  function quoteIfGunPart(tok){
    const t = String(tok).trim();
    if (!t) return '';
    if (t.startsWith('{') && t.endsWith('}')) return t;
    if (/\.part_/.test(t) || /^[A-Z]{3}_[A-Z]{2}\./.test(t)) return `"${t}"`;
    return t;
  }

  
  // Disabled by request: preserve explicit token order and duplicates as-entered.
  function compressConsecutiveFamilyRefs(tokens){
    return Array.isArray(tokens) ? tokens.slice() : [];
  }

  // Disabled by request: preserve explicit token order and duplicates as-entered.
  function compressFamilyRefsAll(tokens){
    return Array.isArray(tokens) ? tokens.slice() : [];
  }

function randSeed(){
    // Avoid 0 so the seed marker is always emitted for auto seeds.
    return Math.floor(Math.random() * 9999) + 1;
  }

  function getSeed(base){
    const seedEl = $('seedInput');
    const manual = String(seedEl && seedEl.value ? seedEl.value : '').trim();
    if (manual && /^-?\d+$/.test(manual)){
      state.__seedEnabled = true;
      state.seedAuto = null;
      state.seedKey = null;
      if (seedEl) seedEl.placeholder = 'manual';
      return Number(manual);
    }

    // Seed gating: do not auto-roll a random seed until the user begins building.
    if (!state.__seedEnabled){
      if (seedEl && !seedEl.value){
        seedEl.placeholder = 'random (enabled after selecting base / adding a part)';
      }
      return 0;
    }

    const key = base ? `${base.familyId}:${base.itemId}:${Number(state.level || 1)}` : 'none';
    if (typeof state.seedAuto !== 'number' || state.seedKey !== key){
      state.seedAuto = randSeed();
      state.seedKey = key;
    }
    if (seedEl) seedEl.placeholder = `random (${state.seedAuto})`;
    return state.seedAuto;
  }

  function isPhospheneLabel(label){
    return /(phosphene|shiny)/i.test(label || '');
  }

  function unquoteWrappedValue(v){
    let s = String(v || '').trim();
    // Some select values are serialized as quoted tokens; normalize once here.
    while (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))){
      s = s.slice(1, -1).trim();
    }
    return s;
  }

  function hasSpawnCode(label, value){
    const lbl = String(label || '').trim();
    const val = unquoteWrappedValue(value);
    if (!lbl && !val) return false;
    if (/^Cosmetics_Weapon_/i.test(val) || /^Cosmetics_Weapon_/i.test(lbl)) return true;
    if (/spawn[\s_-]*id/i.test(lbl)) return true;
    const m = lbl.match(/\(([^)]+)\)/);
    if (m && m[1]){
      const inside = String(m[1]).trim();
      if (/^Cosmetics_Weapon_/i.test(inside)) return true;
      if (/[A-Za-z_]/.test(inside) && !/^\d+\s*:\s*(?:\[\s*\d+(?:\s+\d+)*\s*\]|\d+)\s*$/.test(inside)) return true;
    }
    return false;
  }

  function isCamoTokenSyntax(value){
    const s = unquoteWrappedValue(value);
    return /^\|\s*["']?c["']?\s*,\s*\d+\s*\|$/i.test(s);
  }

  function isCamoLiteralSyntax(value){
    const s = unquoteWrappedValue(value);
    return /^\|?\s*["']?c["']?\s*,\s*\d+\s*\|?$/i.test(s);
  }

  function extractSkinNumericId(value, allowBareNumeric, allowGenericNumericBrace){
    const s = unquoteWrappedValue(value);
    if (!s) return null;
    let m = s.match(/^\{\s*27\s*:\s*(\d+)\s*\}$/);
    if (m) return Number(m[1]);
    m = s.match(/^\|\s*["']?c["']?\s*,\s*(\d+)\s*\|$/i);
    if (m) return Number(m[1]);
    m = s.match(/^["']?c["']?\s*,\s*(\d+)$/i);
    if (m) return Number(m[1]);
    if (allowGenericNumericBrace){
      m = s.match(/^\{\s*\d+\s*:\s*(\d+)\s*\}$/);
      if (m) return Number(m[1]);
    }
    if (allowBareNumeric){
      m = s.match(/^(\d+)$/);
      if (m) return Number(m[1]);
    }
    return null;
  }

  function canonicalSkinToken(value, allowBareNumeric, allowGenericNumericBrace){
    const s = unquoteWrappedValue(value);
    if (!s) return '';
    const id = extractSkinNumericId(s, !!allowBareNumeric, !!allowGenericNumericBrace);
    if (Number.isFinite(id)) return `|"c",${id}|`;
    return s;
  }

  function canonicalCamoToken(value){
    const s = unquoteWrappedValue(value);
    if (!s) return '';
    const m = s.match(/^\|\s*["']?c["']?\s*,\s*(\d+)\s*\|$/i)
      || s.match(/^["']?c["']?\s*,\s*(\d+)$/i)
      || s.match(/^\{\s*\d+\s*:\s*(\d+)\s*\}$/);
    if (!m) return '';
    return `|"c",${Number(m[1])}|`;
  }

  function isSkinTokenCandidate(value){
    const s = String(value || '').trim();
    if (!s) return false;
    const unq = unquoteWrappedValue(s);
    if (/^Cosmetics_Weapon_/i.test(unq)) return true;
    return Number.isFinite(extractSkinNumericId(unq, false, false));
  }

  function extractNumericIdFromLabelText(text){
    const s = String(text || '').trim();
    if (!s) return null;
    let m = s.match(/\{\s*\d+\s*:\s*(\d+)\s*\}/);
    if (m) return Number(m[1]);
    m = s.match(/\(\s*\d+\s*:\s*(\d+)\s*\)/);
    if (m) return Number(m[1]);
    m = s.match(/\b\d+\s*:\s*(\d+)\b/);
    if (m) return Number(m[1]);
    m = s.match(/\|\s*["']?c["']?\s*,\s*(\d+)\s*\|/i);
    if (m) return Number(m[1]);
    return null;
  }

  function parseItemIdFromIdRawText(raw){
    const s = unquoteWrappedValue(raw);
    if (!s) return null;
    let m = s.match(/^\s*\d+\s*:\s*(\d+)\s*$/);
    if (m) return Number(m[1]);
    m = s.match(/^\s*(\d+)\s*$/);
    if (m) return Number(m[1]);
    return null;
  }

  function parseFamilyItemPair(raw){
    const s = unquoteWrappedValue(raw);
    if (!s) return null;
    let m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/) || s.match(/^(\d+)\s*:\s*(\d+)$/);
    if (m) return { family: Number(m[1]), itemId: Number(m[2]) };
    m = s.match(/^\{\s*(\d+)\s*\}$/) || s.match(/^(\d+)$/);
    if (m) return { family: null, itemId: Number(m[1]) };
    return null;
  }

  function tokenFromPair(pair, fallbackFamily){
    const p = pair || null;
    if (!p || !Number.isFinite(Number(p.itemId))) return '';
    const itemId = Number(p.itemId);
    const fam = Number.isFinite(Number(p.family)) ? Number(p.family)
      : (Number.isFinite(Number(fallbackFamily)) ? Number(fallbackFamily) : null);
    if (Number.isFinite(fam)) return `{${fam}:${itemId}}`;
    return `{${itemId}}`;
  }

  function resolveSpawnSkinRarityId(raw){
    const key = unquoteWrappedValue(raw);
    if (!/^Cosmetics_Weapon_/i.test(key)) return null;
    const cacheKey = `__spawnSkinRid__${key}`;
    try{
      if (Object.prototype.hasOwnProperty.call(window, cacheKey)){
        const hit = Number(window[cacheKey]);
        return Number.isFinite(hit) ? hit : null;
      }
    }catch(_){}

    let resolved = null;

    try{
      let part = null;
      if (typeof window.__lookupPartByImportCode === 'function') part = window.__lookupPartByImportCode(key);
      if (!part && typeof window.lookupPart === 'function') part = window.lookupPart(key);
      const pid = part ? Number(part.itemId || part.id || part.partId) : NaN;
      if (Number.isFinite(pid)) resolved = Number(pid);
    }catch(_){}

    if (!Number.isFinite(resolved)){
      try{
        const map = window.__ccSpawnToIdRawMap;
        if (map && typeof map.get === 'function'){
          const unquoted = key.replace(/^"+|"+$/g, '');
          const idRaw = String(map.get(key) || map.get(unquoted) || map.get(`"${unquoted}"`) || '').trim();
          const rid = parseItemIdFromIdRawText(idRaw);
          if (Number.isFinite(rid)) resolved = Number(rid);
        }
      }catch(_){}
    }

    if (!Number.isFinite(resolved)){
      try{
        const arr = Array.isArray(window.ALL_PARTS) ? window.ALL_PARTS
          : (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : []);
        const lk = key.toLowerCase();
        for (const p of (arr || [])){
          if (!p) continue;
          const vals = [
            String(p.code || '').trim(),
            String(p.spawnCode || '').trim(),
            String(p.spawn_id || '').trim(),
            String(p.partString || '').trim(),
            String(p.partCode || '').trim()
          ];
          const match = vals.some(v => String(v || '').toLowerCase() === lk);
          if (!match) continue;
          const pid = Number(p.itemId || p.id || p.partId);
          if (Number.isFinite(pid)){ resolved = Number(pid); break; }
        }
      }catch(_){}
    }

    try{ window[cacheKey] = Number.isFinite(resolved) ? Number(resolved) : ''; }catch(_){}
    return Number.isFinite(resolved) ? Number(resolved) : null;
  }

  function extractSkinRarityId(valueRaw, optionEl){
    const raw = String(valueRaw || '').trim();
    if (!raw) return null;
    // Token-form camos are not rarity-id skins.
    if (isCamoLiteralSyntax(raw)) return null;

    const direct = extractSkinNumericId(raw, true, true);
    if (Number.isFinite(direct)) return Number(direct);

    try{
      const ds = optionEl && optionEl.dataset ? optionEl.dataset : null;
      const idRaw = String((ds && (ds.idRaw || ds.idraw || ds.skinIdRaw || ds.skinidraw)) || '').trim();
      let m = idRaw.match(/^\s*\d+\s*:\s*(\d+)\s*$/);
      if (m) return Number(m[1]);
      m = idRaw.match(/^\s*(\d+)\s*$/);
      if (m) return Number(m[1]);
      const sid = String((ds && (ds.skinId || ds.skinid || ds.itemId || ds.itemid)) || '').trim();
      if (/^\d+$/.test(sid)) return Number(sid);
    }catch(_){}

    const text = String(optionEl && (optionEl.textContent || optionEl.label) || '').trim();
    const base = String(optionEl && optionEl.getAttribute && optionEl.getAttribute('data-base-label') || '').trim();
    const labelHit = extractNumericIdFromLabelText(text) ?? extractNumericIdFromLabelText(base);
    if (Number.isFinite(labelHit)) return Number(labelHit);

    const spawnHit = resolveSpawnSkinRarityId(raw);
    if (Number.isFinite(spawnHit)) return Number(spawnHit);

    return null;
  }

  function extractSkinRarityToken(valueRaw, optionEl){
    const raw = String(valueRaw || '').trim();
    if (!raw) return '';
    if (isCamoLiteralSyntax(raw)) return '';
    const spawnRaw = unquoteWrappedValue(raw);
    if (/^Cosmetics_Weapon_/i.test(spawnRaw)){
      return `"${String(spawnRaw).replace(/"/g, '\\"')}"`;
    }

    let pair = parseFamilyItemPair(raw);
    if (pair){
      return tokenFromPair(pair, null);
    }

    try{
      const ds = optionEl && optionEl.dataset ? optionEl.dataset : null;
      const idRaw = String((ds && (ds.idRaw || ds.idraw || ds.skinIdRaw || ds.skinidraw)) || '').trim();
      pair = parseFamilyItemPair(idRaw);
      if (pair) return tokenFromPair(pair, null);

      const famRaw = String((ds && (ds.family || ds.familyId || ds.ccFamily)) || '').trim();
      const sidRaw = String((ds && (ds.skinId || ds.skinid || ds.itemId || ds.itemid || ds.id || ds.partId)) || '').trim();
      if (/^\d+$/.test(famRaw) && /^\d+$/.test(sidRaw)){
        return `{${Number(famRaw)}:${Number(sidRaw)}}`;
      }
    }catch(_){}

    try{
      const text = String(optionEl && (optionEl.textContent || optionEl.label) || '').trim();
      const base = String(optionEl && optionEl.getAttribute && optionEl.getAttribute('data-base-label') || '').trim();
      let m = text.match(/\{\s*(\d+)\s*:\s*(\d+)\s*\}/) || text.match(/\(\s*(\d+)\s*:\s*(\d+)\s*\)/);
      if (!m) m = base.match(/\{\s*(\d+)\s*:\s*(\d+)\s*\}/) || base.match(/\(\s*(\d+)\s*:\s*(\d+)\s*\)/);
      if (m) return `{${Number(m[1])}:${Number(m[2])}}`;
    }catch(_){}

    const rid = extractSkinRarityId(raw, optionEl);
    if (Number.isFinite(rid)) return `{${Number(rid)}}`;
    return '';
  }

  function forceFamilyOnRarityToken(tokenRaw, fallbackFamily){
    const s = String(tokenRaw || '').trim();
    if (!s) return '';
    const pair = parseFamilyItemPair(s);
    if (!pair) return s;
    return tokenFromPair(pair, fallbackFamily);
  }

  function getSelectedWeaponSkinAndCamo(){
    const skinSel = $('skinSelect');
    const camoSel = $('camoSelect');
    const skinRaw = String((skinSel && skinSel.value) || '').trim();
    const skinOpt = (skinSel && skinSel.selectedOptions && skinSel.selectedOptions[0]) ? skinSel.selectedOptions[0] : null;
    const camoRaw = String((camoSel && camoSel.value) || '').trim();

    const rarityId = extractSkinRarityId(skinRaw, skinOpt);
    const rarityToken = extractSkinRarityToken(skinRaw, skinOpt);
    let camoToken = canonicalCamoToken(camoRaw);
    return {
      skinRaw,
      camoRaw,
      rarityId: Number.isFinite(rarityId) ? Number(rarityId) : null,
      rarityToken: String(rarityToken || '').trim(),
      camoToken: String(camoToken || '').trim()
    };
  }

  function getSelectedMainPartFromUi(){
    const sel = $('mainPart');
    const key = String((sel && sel.value) || '').trim();
    if (!key) return null;
    try{
      const map = state && state.__mainPartByOptionKey;
      if (map && typeof map.get === 'function'){
        const hit = map.get(key);
        if (hit) return hit;
      }
    }catch(_){}
    if (/^idx:\s*-?\d+$/i.test(key)){
      const idx = Number(key.replace(/^idx:\s*/i, ''));
      if (Number.isFinite(idx)) return getAllParts()[idx] || null;
    }
    if (/^-?\d+$/.test(key)){
      const idx = Number(key);
      if (Number.isFinite(idx)) return getAllParts()[idx] || null;
    }
    return state.mainPart || null;
  }

  function findMainPartKeyForSkinRarityId(rarityId, preferredFamilyId){
    const rid = Number(rarityId);
    if (!Number.isFinite(rid)) return '';
    const map = state && state.__mainPartByOptionKey;
    if (!map || typeof map.entries !== 'function') return '';

    const famHint = Number(preferredFamilyId);
    let fallback = '';
    for (const [k, p] of map.entries()){
      if (!p) continue;
      if (String((p.partType || '')).trim().toLowerCase() !== 'rarity') continue;
      const pid = partItemIdOf(p);
      if (!Number.isFinite(pid) || Number(pid) !== rid) continue;

      if (Number.isFinite(famHint)){
        const pf = partFamilyIdOf(p);
        if (Number.isFinite(pf) && Number(pf) === famHint) return String(k);
      }
      if (!fallback) fallback = String(k);
    }
    return fallback;
  }

  function syncMainPartFromSkinSelection(){
    if (String(state.itemType || '').trim() !== 'Weapon') return false;
    const mainSel = $('mainPart');
    if (!mainSel) return false;

    const skinSel = getSelectedWeaponSkinAndCamo();
    const rid = Number(skinSel && skinSel.rarityId);
    if (!Number.isFinite(rid)) return false;

    let mapReady = !!(state && state.__mainPartByOptionKey && typeof state.__mainPartByOptionKey.entries === 'function' && state.__mainPartByOptionKey.size);
    if (!mapReady){
      refreshMainPart();
      mapReady = !!(state && state.__mainPartByOptionKey && typeof state.__mainPartByOptionKey.entries === 'function' && state.__mainPartByOptionKey.size);
    }
    if (!mapReady) return false;

    let famHint = null;
    const parsed = parseFamilyItemPair(skinSel && skinSel.rarityToken);
    if (parsed && Number.isFinite(Number(parsed.family))) famHint = Number(parsed.family);
    if (!Number.isFinite(famHint)){
      const base = getSelectedBaseItem();
      if (base && Number.isFinite(Number(base.familyId))) famHint = Number(base.familyId);
    }

    const targetKey = findMainPartKeyForSkinRarityId(rid, famHint);
    if (!targetKey) return false;

    const currentMain = getSelectedMainPartFromUi();
    const currentRid = partItemIdOf(currentMain);
    const currentIsRarity = String((currentMain && currentMain.partType) || '').trim().toLowerCase() === 'rarity';
    const currentKey = String(mainSel.value || '').trim();
    if (currentIsRarity && Number.isFinite(currentRid) && Number(currentRid) === rid && currentKey === String(targetKey)){
      return false;
    }

    if (!Array.from(mainSel.options || []).some(o => String(o.value || '').trim() === String(targetKey))) return false;
    mainSel.value = String(targetKey);
    mainSel.dispatchEvent(new Event('change'));
    return true;
  }

  function syncCamoOptionsFromParent(){
    const sel = $('camoSelect');
    if (!sel) return;

    const parentDoc = (window.parent && window.parent.document)
      ? window.parent.document
      : document;
    const parentSel = parentDoc
      ? parentDoc.getElementById('skin')
      : null;
    const parentCamoSel = parentDoc ? parentDoc.getElementById('skinCamo') : null;

    const keep = [];
    const seen = new Set();
    const push = (tok, labelRaw)=>{
      const token = canonicalCamoToken(tok);
      if (!token) return;
      const key = token.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      let label = String(labelRaw || '').trim();
      label = label
        .replace(/<[^>]*>/g, ' ')
        .replace(/\{\s*\d+\s*:\s*\d+\s*\}/g, ' ')
        .replace(/\(\s*\d+\s*:\s*\d+\s*\)/g, ' ')
        .replace(/\|\s*["']?c["']?\s*,\s*\d+\s*\|/gi, ' ')
        .replace(/\[\s*token\s*\]/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (!label){
        const m = token.match(/\|\s*["']?c["']?\s*,\s*(\d+)\s*\|/i);
        label = m ? `Camo ${m[1]}` : 'Camo';
      }
      if (!/\[token\]/i.test(label)) label += ' [token]';
      keep.push({ value: token, label });
    };

    try{
      if (parentSel && parentSel.options){
        Array.from(parentSel.options || []).forEach(function(o){
          if (!o) return;
          const v = String(o.value || '').trim();
          const l = String(o.getAttribute('data-base-label') || o.textContent || o.label || '').trim();
          if (isCamoLiteralSyntax(v) || /\|\s*["']?c["']?\s*,\s*\d+\s*\|/i.test(l) || /\b["']?c["']?\s*,\s*\d+\b/i.test(l) || /\[token\]/i.test(l)){
            push(v, l);
          }
        });
      }
    }catch(_){}

    // If the host page has a dedicated camo dropdown, mirror it directly.
    try{
      if (parentCamoSel && parentCamoSel.options){
        Array.from(parentCamoSel.options || []).forEach(function(o){
          if (!o) return;
          const v = String(o.value || '').trim();
          const l = String(o.getAttribute('data-base-label') || o.textContent || o.label || '').trim();
          if (isCamoLiteralSyntax(v) || /\|\s*["']?c["']?\s*,\s*\d+\s*\|/i.test(l) || /\b["']?c["']?\s*,\s*\d+\b/i.test(l) || /\[token\]/i.test(l)){
            push(v, l);
          }
        });
      }
    }catch(_){}

    const skinsSource = (() => {
      try{
        return (window.parent && window.parent.SKINS) ? window.parent.SKINS : (window.SKINS || null);
      }catch(_){ return null; }
    })();
    try{
      if (skinsSource && typeof skinsSource === 'object'){
        for (const cat of Object.keys(skinsSource)){
          const arr = skinsSource[cat];
          if (!Array.isArray(arr)) continue;
          for (const sk of arr){
            if (!sk) continue;
            const v = String(sk.code || '').trim();
            const l = String(sk.name || sk.label || '').trim();
            if (isCamoLiteralSyntax(v) || /\|\s*["']?c["']?\s*,\s*\d+\s*\|/i.test(l) || /\b["']?c["']?\s*,\s*\d+\b/i.test(l) || /\[token\]/i.test(l)){
              push(v, l);
            }
          }
        }
      }
    }catch(_){}

    // Fallback: if no literal token entries exist in this dataset, expose token aliases from numeric IDs.
    if (!keep.length){
      const pushAliasFromNumeric = (valueRaw, labelRaw)=>{
        const value = unquoteWrappedValue(valueRaw);
        if (!value || /^Cosmetics_Weapon_/i.test(value)) return;
        const label = String(labelRaw || '').trim();
        let id = extractSkinNumericId(value, true, true);
        if (!Number.isFinite(id)) id = extractNumericIdFromLabelText(label);
        if (!Number.isFinite(id)) return;
        push(`|"c",${Number(id)}|`, label || `Camo ${Number(id)}`);
      };
      try{
        if (parentSel && parentSel.options){
          Array.from(parentSel.options || []).forEach(function(o){
            if (!o) return;
            pushAliasFromNumeric(String(o.value || '').trim(), String(o.getAttribute('data-base-label') || o.textContent || o.label || '').trim());
          });
        }
      }catch(_){}
      try{
        if (skinsSource && typeof skinsSource === 'object'){
          for (const cat of Object.keys(skinsSource)){
            const arr = skinsSource[cat];
            if (!Array.isArray(arr)) continue;
            for (const sk of arr){
              if (!sk) continue;
              pushAliasFromNumeric(String(sk.code || '').trim(), String(sk.name || sk.label || '').trim());
            }
          }
        }
      }catch(_){}
      try{
        const extras = (window.parent && window.parent.__CC_EXTRA_NUMERIC_SKINS) ? window.parent.__CC_EXTRA_NUMERIC_SKINS : (window.__CC_EXTRA_NUMERIC_SKINS || []);
        if (Array.isArray(extras)){
          for (const ex of extras){
            if (!ex) continue;
            const code = Array.isArray(ex) ? ex[0] : ex.code;
            const name = Array.isArray(ex) ? ex[1] : (ex.name || ex.label);
            pushAliasFromNumeric(String(code || '').trim(), String(name || '').trim());
          }
        }
      }catch(_){}
    }

    const cur = String(sel.value || '').trim();
    sel.innerHTML = '<option value="">-- None --</option>';
    for (const row of keep){
      const o = document.createElement('option');
      o.value = row.value;
      o.textContent = row.label;
      if (typeof window.skinTooltipText === 'function') { const t = window.skinTooltipText(row.value, row.label); if (t) o.title = t; }
      sel.appendChild(o);
    }
    if (cur && Array.from(sel.options || []).some(o => String(o.value || '').trim() === cur)){
      sel.value = cur;
    }
  }

  function syncSkinOptionsFromParent(){
    const sel = $('skinSelect');
    if (!sel) return;

    const parentDoc = (window.parent && window.parent.document)
      ? window.parent.document
      : document;
    const parentSel = parentDoc ? parentDoc.getElementById('skin') : null;

    const seen = new Set();
    const grouped = {
      spawn: [],
      numeric: [],
      phosphene: []
    };
    const cleanSkinLabel = (labelRaw, valueRaw)=>{
      const value = String(valueRaw || '').trim();
      const id = extractSkinNumericId(value, true, true);
      let t = String(labelRaw || '').trim();
      t = t.replace(/<[^>]*>/g, ' ');
      t = t.replace(/\(\s*\{\s*\d+\s*:\s*(?:\[\s*\d+(?:\s+\d+)*\s*\]|\d+)\s*\}\s*\)/g, ' ');
      t = t.replace(/\{\s*\d+\s*:\s*(?:\[\s*\d+(?:\s+\d+)*\s*\]|\d+)\s*\}/g, ' ');
      t = t.replace(/\(\s*\d+\s*:\s*(?:\[\s*\d+(?:\s+\d+)*\s*\]|\d+)\s*\)/g, ' ');
      t = t.replace(/\|\s*["']?c["']?\s*,\s*\d+\s*\|/gi, '');
      t = t.replace(/\bid\s*[:#-]?\s*\d+\b/gi, '');
      t = t.replace(/\b\d+\s*:\s*\d+\b/g, '');
      t = t.replace(/\[\s*token\s*\]/gi, '');
      t = t.replace(/\(\s*\)/g, '');
      t = t.replace(/\s{2,}/g, ' ').trim();
      if (!t){
        if (isPhospheneLabel(labelRaw) || isPhospheneLabel(value)) t = 'Phosphene';
        else if (hasSpawnCode(labelRaw, value) || /^Cosmetics_Weapon_/i.test(value)) t = 'Spawn Skin';
        else t = Number.isFinite(id) ? `Skin ${id}` : 'Skin';
      }
      return t;
    };
    const classifyGroup = (valueRaw, labelRaw)=>{
      const value = String(valueRaw || '').trim();
      const label = String(labelRaw || '').trim();
      if (isPhospheneLabel(label) || isPhospheneLabel(value)) return 'phosphene';
      if (hasSpawnCode(label, value) || /^Cosmetics_Weapon_/i.test(value)) return 'spawn';
      return 'numeric';
    };
    const pushEntry = (value, label, groupKey)=>{
      const v = String(value || '').trim();
      if (!v) return;
      const l = String(label || v).trim() || v;
      const key = v.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const sid = extractSkinRarityId(v, null);
      const bucket = grouped[groupKey] || grouped.numeric;
      bucket.push({ value: v, label: l, skinId: Number.isFinite(sid) ? Number(sid) : null });
    };
    const addFromRaw = (valueRaw, labelRaw)=>{
      const raw = String(valueRaw || '').trim();
      if (!raw) return;
      if (isCamoLiteralSyntax(raw)) return; // camo tokens live in camoSelect only
      const label = String(labelRaw || '').trim();
      const cleaned = cleanSkinLabel(label || raw, raw);
      const group = classifyGroup(raw, label || cleaned);
      pushEntry(raw, cleaned || raw, group);
    };

    try{
      if (parentSel && parentSel.options){
        for (const opt of Array.from(parentSel.options || [])){
          addFromRaw(opt.value, opt.textContent);
        }
      }
    }catch(_){}

    // Some skins may exist in SKINS data but not be rendered into the parent select.
    try{
      const skinsSource = (window.parent && window.parent.SKINS) ? window.parent.SKINS : (window.SKINS || null);
      if (skinsSource && typeof skinsSource === 'object'){
        for (const cat of Object.keys(skinsSource)){
          const arr = skinsSource[cat];
          if (!Array.isArray(arr)) continue;
          for (const sk of arr){
            if (!sk) continue;
            addFromRaw(sk.code, sk.name || sk.label || '');
          }
        }
      }
    }catch(_){}
    // Fallback: pull numeric skins from mixer selects and extra numeric registry.
    try{
      const parentDoc2 = parentDoc;
      ['mixSkin1','mixSkin2','mixSkin3'].forEach((id)=>{
        const src = parentDoc2 ? parentDoc2.getElementById(id) : null;
        if (!src || !src.options) return;
        for (const opt of Array.from(src.options || [])){
          if (!opt) continue;
          addFromRaw(opt.value, opt.getAttribute('data-base-label') || opt.textContent || opt.label || '');
        }
      });
    }catch(_){}
    try{
      const extras = (window.parent && window.parent.__CC_EXTRA_NUMERIC_SKINS)
        ? window.parent.__CC_EXTRA_NUMERIC_SKINS
        : (window.__CC_EXTRA_NUMERIC_SKINS || []);
      if (Array.isArray(extras)){
        for (const ex of extras){
          if (!ex) continue;
          if (Array.isArray(ex)) addFromRaw(ex[0], ex[1] || '');
          else addFromRaw(ex.code, ex.name || ex.label || '');
        }
      }
    }catch(_){}

    // SPAWN_SKINS: spawn-id and phosphene skins when no parent select (standalone rebuild)
    try{
      const spawnList = (window.parent && window.parent.SPAWN_SKINS) ? window.parent.SPAWN_SKINS : (window.SPAWN_SKINS || []);
      if (Array.isArray(spawnList)){
        for (const s of spawnList){
          if (!s) continue;
          const v = String(s.value || s.code || '').trim();
          const l = String(s.label || s.name || '').trim();
          if (v) addFromRaw(v, l);
        }
      }
    }catch(_){}

    // Preserve selection
    const curRaw = String(sel.value || '').trim();
    const cur = canonicalSkinToken(curRaw, true, true) || curRaw;
    const tokenTransfer = isCamoTokenSyntax(curRaw) ? canonicalCamoToken(curRaw) : '';
    sel.innerHTML = '<option value="">-- None --</option>';
    const sortRows = (rows)=>rows.sort((a,b)=>String(a.label || '').localeCompare(String(b.label || ''), undefined, { numeric:true, sensitivity:'base' }));
    sortRows(grouped.spawn);
    sortRows(grouped.numeric);
    sortRows(grouped.phosphene);
    const appendGroup = (title, rows)=>{
      if (!Array.isArray(rows) || !rows.length) return;
      const og = document.createElement('optgroup');
      og.label = title;
      for (const row of rows){
        const o = document.createElement('option');
        o.value = row.value;
        o.textContent = row.label;
        try{
          if (Number.isFinite(row.skinId)) o.setAttribute('data-skin-id', String(row.skinId));
          o.setAttribute('data-base-label', String(row.label || '').trim());
        }catch(_){}
        if (typeof window.skinTooltipText === 'function') { const t = window.skinTooltipText(row.value, row.label); if (t) o.title = t; }
        og.appendChild(o);
      }
      sel.appendChild(og);
    };
    appendGroup('Spawn-ID Skins', grouped.spawn);
    appendGroup('Numeric ID Skins', grouped.numeric);
    appendGroup('Phosphene / Shiny', grouped.phosphene);

    if (curRaw && Array.from(sel.options).some(o=>o.value===curRaw)) sel.value = curRaw;
    else if (cur && Array.from(sel.options).some(o=>o.value===cur)) sel.value = cur;
    else sel.value = '';
    syncCamoOptionsFromParent();
    if (tokenTransfer && $('camoSelect') && Array.from(($('camoSelect').options || [])).some(o => String(o.value || '').trim() === tokenTransfer)){
      $('camoSelect').value = tokenTransfer;
    }
  }

  
function computeFullDeserializedCode(){
  if (state.mainPart && state.mainPart.__fullDeserialized){
    return String(state.mainPart.__fullDeserialized).trim();
  }
  const guided = getGuidedContext();
  const useGuided = guided && guided.itemType;
  let base = getSelectedBaseItem();
  if (!base) return '';
  const level = useGuided ? (Number(guided.level) || 60) : Number(state.level || 60);

  const orderedParts = computeOrderedParts().map(p => tokenForPart(p) || normCode(p.code)).filter(Boolean);

  // Rarity helpers (tier for filtering; emits rarity token after ||)
  const selectedTier = getSelectedRarityTier();
  const useTierFilter = rarityTierFilterActiveForCurrentContext();
  const baseFamilyId = Number(base && base.familyId);
  let rarityRows = getRarityRowsForCurrentContext();
  if (useTierFilter && Number.isFinite(selectedTier)){
    rarityRows = rarityRows.filter(r => rarityTierFromItemTypeString(r && r.itemTypeString, r) === selectedTier);
  }
  let rarityRow = null;
  if (Number.isFinite(baseFamilyId)){
    const byFam = rarityRows.filter(r => Number(r && r.familyId) === baseFamilyId);
    if (byFam.length){
      rarityRow = byFam.find(r => !String(r && r.legendaryName || '').trim()) || byFam[0];
    }
  }
  if (!rarityRow){
    rarityRow = rarityRows.find(r => !String(r && r.legendaryName || '').trim()) || rarityRows[0] || null;
  }

  const rarityTierId = Number.isFinite(selectedTier)
    ? selectedTier
    : (rarityRow ? rarityTierFromItemTypeString(rarityRow.itemTypeString, rarityRow) : null);
  let rarityItemId = rarityRow && Number.isFinite(Number(rarityRow.itemId))
    ? Number(rarityRow.itemId)
    : (base && Number.isFinite(Number(base.itemId)) ? Number(base.itemId) : null);
  const mainPartIsRarity = String((state.mainPart && state.mainPart.partType) || '').trim().toLowerCase() === 'rarity';
  const mainPartRarityItemId = mainPartIsRarity ? partItemIdOf(state.mainPart || null) : null;
  if (Number.isFinite(mainPartRarityItemId)){
    rarityItemId = Number(mainPartRarityItemId);
  }
  const raritySlotPartRaw = state && state.slots ? state.slots.rarity : null;
  const raritySlotPart = Array.isArray(raritySlotPartRaw) ? (raritySlotPartRaw[0] || null) : raritySlotPartRaw;
  const raritySlotIsRarity = String((raritySlotPart && raritySlotPart.partType) || '').trim().toLowerCase() === 'rarity';
  const raritySlotItemId = raritySlotIsRarity ? partItemIdOf(raritySlotPart || null) : null;
  if (Number.isFinite(raritySlotItemId)){
    rarityItemId = Number(raritySlotItemId);
  }
  const isWeapon = (state.itemType === 'Weapon') || (state.detectedCategory === 'Weapon');
  const weaponSkinSelection = isWeapon ? getSelectedWeaponSkinAndCamo() : null;
  let skinRarityToken = (weaponSkinSelection && weaponSkinSelection.rarityToken)
    ? forceFamilyOnRarityToken(weaponSkinSelection.rarityToken, baseFamilyId)
    : '';
  if (weaponSkinSelection && Number.isFinite(weaponSkinSelection.rarityId)){
    const skinRid = Number(weaponSkinSelection.rarityId);
    rarityItemId = skinRid;
    if (!String(skinRarityToken || '').trim()){
      // Numeric skin selections without explicit family metadata must still serialize as {family:id}.
      skinRarityToken = tokenFromPair({ family: baseFamilyId, itemId: skinRid }, baseFamilyId);
    } else {
      skinRarityToken = forceFamilyOnRarityToken(skinRarityToken, baseFamilyId);
    }
  }
  const rarityItemIdStr = Number.isFinite(rarityItemId) ? String(rarityItemId) : '';
  function tokenIdOnlyForRarity(tok){
    const s = String(tok || '').trim();
    let m = s.match(/^\{\s*\d+\s*:\s*(\d+)\s*\}$/);
    if (m && m[1]) return String(m[1]);
    m = s.match(/^\{\s*(\d+)\s*\}$/);
    if (m && m[1]) return String(m[1]);
    return '';
  }
  const orderedHasRarity = !!(rarityItemIdStr && orderedParts.some(t => tokenIdOnlyForRarity(t) === rarityItemIdStr));
  const rarityTok = String(skinRarityToken || '').trim()
    || (Number.isFinite(rarityItemId) ? `{${rarityItemId}}` : '');
  const __rarityTokN = String(rarityTok || '').replace(/\s+/g,'').trim();
  const isSameAsSelectedRarityToken = (tok)=>{
    if (!__rarityTokN) return false;
    const one = normalizeIdTokensForBaseFamily([String(tok || '').trim()], baseFamilyId);
    if (!Array.isArray(one) || !one.length) return false;
    return String(one[0] || '').replace(/\s+/g,'').trim() === __rarityTokN;
  };
// Weapon detection should not depend on main-part selection.

  if (isWeapon){
    const isElement = (t)=>/^\{\s*1\s*:\s*\d+\s*\}$/.test(t);
    const isSkin = (t)=>isSkinTokenCandidate(t);

    const bracketTokens = [];
    const gunTokens = [];
    const camoTokens = [];
    const elements = [];

    for (const t of orderedParts){
      if (!t) continue;
      if (isSameAsSelectedRarityToken(t)) continue;
      if (isSkin(t)) {
        const ct = canonicalCamoToken(t);
        if (ct) camoTokens.push(ct);
        continue;
      }
      if (isElement(t)) { elements.push(t); continue; }
      if (t.startsWith('{')) bracketTokens.push(t);
      else gunTokens.push(t);
    }

    // Optional camo token from dedicated camo dropdown (or token-form skin selection).
    if (weaponSkinSelection && weaponSkinSelection.camoToken){
      camoTokens.push(String(weaponSkinSelection.camoToken || '').trim());
    }
    const skinTok = camoTokens.length ? String(camoTokens[camoTokens.length - 1] || '').trim() : '';

    // Elements from selection
    const primObj = ELEMENTS.find(x=>x.key===(state.primaryElement||'None'));
    if (primObj && primObj.code) elements.unshift(primObj.code);
    if (Array.isArray(state.elementStack)){
      for (const e of state.elementStack){
        const eo = ELEMENTS.find(x=>x.key===e);
        if (eo && eo.code) elements.push(eo.code);
      }
    }

    const __bracketRaw = (state.idMode && window.__CC_ENABLE_FAMILY_REF_COMPRESS === true)
      ? compressFamilyRefsAll(bracketTokens)
      : bracketTokens;
    const __bracket = normalizeIdTokensForBaseFamily(__bracketRaw, baseFamilyId);

    const partsSection = [...__bracket, ...gunTokens.map(quoteIfGunPart), ...elements]
      .filter(Boolean)
      .join(' ')
      .trim();

    const seed = getSeed(base);
    let tail = [rarityTok, partsSection].filter(Boolean).join(' ').trim();
    if (skinTok) tail = [tail, skinTok].filter(Boolean).join(' ').trim();

    // Optional firmware lock / buyback flag segment (emitted only when checked).
  const lockFirmware = !!(
    (state && state.lockFirmware) ||
    ($('lockFirmware') && $('lockFirmware').checked) ||
    ($('firmwareLock') && $('firmwareLock').checked)
  );
  const buybackFlag = !!(
    (state && state.buybackFlag) ||
    ($('buybackFlag') && $('buybackFlag').checked)
  );

  let out = `${base.familyId}, 0, 1, ${level}|`;
  if (lockFirmware || buybackFlag) out += ` 9, 1|`;
    if (Number(seed) !== 0) out += ` 2, ${seed}||`;
    else out += '|';
    if (tail){
      out += /\|\s*$/.test(tail) ? ` ${tail}` : ` ${tail}|`;
    } else {
      out += `|`;
    }

    return out;
  }

  const __partsArrRaw = orderedParts
    .filter(t => !isSameAsSelectedRarityToken(t))
    .map(quoteIfGunPart)
    .filter(Boolean);
  const __partsArr = normalizeIdTokensForBaseFamily(__partsArrRaw, baseFamilyId);

  // Keep duplicate/stacked tokens by default; enable family compression only when explicitly requested.
  const partsSection = ((state.idMode && window.__CC_ENABLE_FAMILY_REF_COMPRESS === true) ? compressFamilyRefsAll(__partsArr) : compressConsecutiveFamilyRefs(__partsArr))
    .join(' ')
    .trim();
  const seed = getSeed(base);
  const tail = [rarityTok, partsSection].filter(Boolean).join(' ').trim();

  // Optional firmware lock / buyback flag segment (emitted only when checked).
  const lockFirmware = !!(
    (state && state.lockFirmware) ||
    ($('lockFirmware') && $('lockFirmware').checked) ||
    ($('firmwareLock') && $('firmwareLock').checked)
  );
  const buybackFlag = !!(
    (state && state.buybackFlag) ||
    ($('buybackFlag') && $('buybackFlag').checked)
  );

  let out = `${base.familyId}, 0, 1, ${level}|`;
  if (lockFirmware || buybackFlag) out += ` 9, 1|`;
  if (Number(seed) !== 0) out += ` 2, ${seed}||`;
  else out += '|';
  out += (tail ? ` ${tail}|` : `|`);
  return out;
}
  function refreshOutputs(){
    if (typeof window.__ccIsScrollBusy === 'function' && window.__ccIsScrollBusy()) return;
    const {tokens, json} = computeOutputTokens();
    const listBase = getSelectedBaseItem();
    const listFamily = Number(listBase && listBase.familyId);
    const listTokensRaw = (state.idMode && window.__CC_ENABLE_FAMILY_REF_COMPRESS === true)
      ? compressFamilyRefsAll(tokens)
      : tokens;
    const listTokens = normalizeIdTokensForBaseFamily(listTokensRaw, listFamily);
    $('outList').value = listTokens.join(', ');
    const code = computeFullDeserializedCode();
    // Simple Builder owns #outCode. Guided/global panels are managed by guided-builder scripts.
    if ($('outCode')) $('outCode').value = code;
    try { window.__CC_LAST_CODE_TARGET = 'simple'; } catch (_) {}
    $('outJson').value = JSON.stringify(json, null, 2);
    try { if (typeof window.refreshImportedInspector === 'function') window.refreshImportedInspector(); } catch(_){}
    try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch(_){}
    try { if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true); } catch(_){}
  }

  function updateModeLabel(){
    const el = $('modeLabel');
    if (el) el.textContent = state.idMode ? 'Numeric' : 'Spawn';
  }


  function clearImportedOutputLock(){
    try{
      window.__LOCK_IMPORTED_OUTPUT = false;
      window.__IMPORTED_TAIL_TOKENS = [];
      window.__IMPORTED_PARTS_ORDER_RAW = [];
      window.originalPartsOrder = [];
      window.__LAST_IMPORTED_DESERIALIZED = null;
      window.__IMPORTED_HEADER_FULL = null;
      window.__IMPORTED_BASE_ITEM = null;
      window.__IMPORTED_BASE_FAMILY_ID = null;
    }catch(_){}
  }

function resetAll(){
    clearImportedOutputLock();
    state.itemType = 'Weapon';
    state.manufacturer = '';
    state.weaponType = '';
    state.level = 60;
    state.rarity = '';
    state.swapBodyLegendary = false;
    state.__seedEnabled = false;
    state.buybackFlag = false;
    if ($('buybackFlag')) $('buybackFlag').checked = false;
    state.allParts = false;
    if ($('allPartsToggle')) $('allPartsToggle').checked = false;
    state.seedAuto = null;
    state.seedKey = null;
    if ($('seedInput')) $('seedInput').value = '';
    if ($('skinSelect')) $('skinSelect').value = '';
    if ($('camoSelect')) $('camoSelect').value = '';
    state.mainPart = null;
    clearBuilderState();
    if ($('importBox')) $('importBox').value = '';
    try{ if ($('outCode')) $('outCode').value=''; if ($('outList')) $('outList').value=''; if ($('outJson')) $('outJson').value=''; }catch(_){ }
    refreshTopSelectors();
    $('builder').innerHTML = '';
    $('builderEmpty').style.display = '';
    $('detectedCat').textContent = '-';
    refreshOutputs();
  }

  function clearParts(){
    state.slots = {};
    state.primaryElement = 'None';
    state.elementStack = [];
    state.extras = [];
    refreshBuilder();
  }

  function tryResolveToken(tok){
    const t = String(tok).trim();
    if (!t) return null;

    const all = getAllParts();
    // Try idRaw match
    const byIdRaw = all.find(p => String(p.idRaw ?? '').trim() === t);
    if (byIdRaw) return byIdRaw;

    // Try numeric id match
    if (/^\d+$/.test(t)){
      const n = Number(t);
      const byId = all.find(p => Number(p.id ?? -1) === n);
      if (byId) return byId;
    }

    // Try code match (normalized)
    const tNorm = t.replace(/^"+|"+$/g,'');
    const byCode = all.find(p => normCode(p.code) === tNorm);
    if (byCode) return byCode;

    return null;
  }

  function parseImportTokenList(raw){
    const s = String(raw || '');
    const out = [];
    // Keep camo tokens like |"c",110| intact while still splitting normal CSV/space token lists.
    const rx = /\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]+\}|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^,\s]+/g;
    let m;
    while ((m = rx.exec(s))){
      const tok = String(m[0] || '').trim();
      if (tok) out.push(tok);
    }
    return out;
  }

  function importTokens(){
    const ib = $('importBox');
    if (!ib) return;
    const raw = ib.value || '';
    const tokens = parseImportTokenList(raw);
    if (!tokens.length) return;

    // reset selections but keep top dropdowns
    state.slots = {};
    state.elementStack = [];
    state.extras = [];
    state.primaryElement = 'None';

    // Resolve parts and pick the first matching as main part (if not already set)
    const resolved = tokens.map(t => ({t, p: tryResolveToken(t)}));

    // TypeID 1 tokens (used by weapon elements and optional shield element row)
    const elementTokens = resolved.filter(x => !x.p && /^\{\s*1\s*:\s*\d+\s*\}$/.test(x.t));
    const partTokens = resolved.filter(x => x.p);

    // Set main part: prefer the category's core part type (e.g. Barrel for weapons)
    if (partTokens.length){
      const detectedCat0 = partTokens[0].p.category || state.itemType;
      const corePt0 = CORE_PARTTYPE_BY_CATEGORY[detectedCat0] || 'Base';
      const main = partTokens.map(x=>x.p).find(p => (p.partType||'') === corePt0) || partTokens[0].p;
      // set top dropdowns to match detected
      state.itemType = main.category || state.itemType;
      $('itemType').value = state.itemType;
      refreshManufacturer();
      state.manufacturer = main.manufacturer || '';
      $('manufacturer').value = state.manufacturer;
      if (state.itemType === 'Weapon'){
        state.weaponType = main.weaponType || main.itemType || '';
        refreshWeaponType();
        $('weaponType').value = state.weaponType;
      }
      refreshMainPart();

      let mainOptKey = '';
      try{
        const map = state && state.__mainPartByOptionKey;
        if (map && typeof map.entries === 'function'){
          const mainTok = tokenForPart(main);
          for (const [k,p] of map.entries()){
            if (p === main){ mainOptKey = k; break; }
            if (p && main && p.__idx != null && main.__idx != null && p.__idx === main.__idx){ mainOptKey = k; break; }
            if (tokenForPart(p) === mainTok){ mainOptKey = k; break; }
          }
        }
      }catch(_e){}
      if (mainOptKey) $('mainPart').value = String(mainOptKey);
      else if (main && main.__idx != null && Number.isFinite(Number(main.__idx))) $('mainPart').value = `idx:${Number(main.__idx)}`;
      state.mainPart = main;
      state.detectedCategory = main.category || state.itemType;
    }

    // Fill slots best-effort by matching partType to first empty slot schema
    const cat = state.detectedCategory;
    const partsLeft = partTokens.slice(1).map(x=>x.p);

    if (cat === 'Weapon'){
      const schema = getActiveWeaponSlotSchema();
      let pool = partsLeft.slice();
      const takeIndex = (pred)=>{
        const idx = pool.findIndex(pred);
        if (idx < 0) return null;
        const p = pool[idx];
        pool.splice(idx, 1);
        return p;
      };
      for (const s of schema){
        if (s.multi && s.key === 'legendary'){
          for (let i = pool.length - 1; i >= 0; i--){
            const p = pool[i];
            if (String(p.partType||'').trim() !== 'Legendary Perks') continue;
            const arr = state.slots.legendary || [];
            const tok = tokenForPart(p);
            if (!arr.some(x => tokenForPart(x) === tok)) arr.push(p);
            state.slots.legendary = arr;
            pool.splice(i, 1);
          }
          continue;
        }
        if (s.multi) continue;
        if (state.slots[s.key]) continue;
        const p = takeIndex(part => {
          const pt = String(part.partType||'').trim();
          const wantPt = String(s.partType||'').trim();
          if (wantPt !== pt){
            if (s.customType === 'weaponPearl' && !pt && /part_pearl/i.test(normCode(part.code))) { /* ok */ }
            else if (wantPt === 'Body Accessory' && pt === 'Body') {
              const c = normCode(part.code).toLowerCase();
              if (!(c.includes('part_body_bolt') || c.includes('part_body_flap'))) return false;
            } else return false;
          }
          if (s.customType === 'weaponPearl' && !/part_pearl/i.test(normCode(part.code))) return false;
          if (s.ncsSlot && !weaponPartMatchesNcsSlot(part, s.ncsSlot)) return false;
          return true;
        });
        if (p) state.slots[s.key] = p;
      }
      for (const p of pool){
        state.extras.push(tokenForPart(p) || normCode(p.code));
      }

      // parse elements ({1:10}-{1:14})
      if (elementTokens.length){
        const ids = elementTokens
          .map(x => parseInt(String(x.t).replace(/\D/g,''),10))
          .filter(n => !isNaN(n));
        const idToKey = new Map(ELEMENTS.filter(e=>e.code).map(e=>[
          parseInt(String(e.code).replace(/\D/g,''),10),
          e.key
        ]));
        const keys = ids.map(id=>idToKey.get(id)).filter(Boolean);
        if (keys.length){
          state.primaryElement = keys[0];
          state.elementStack = keys.slice(1);
        }
      }
    } else {
      const schema = SIMPLE_SCHEMA_BY_CATEGORY[cat] || [];
      const slotByKey = new Map(schema.map(s => [s.key, s]));
      const assignSlot = (s, p) => {
        if (!s || !p) return false;
        if (s.multi){
          const arr = Array.isArray(state.slots[s.key]) ? state.slots[s.key].slice() : [];
          const tok = tokenForPart(p);
          if (!arr.some(x => tokenForPart(x) === tok)) arr.push(p);
          state.slots[s.key] = arr;
          return true;
        }
        if (!state.slots[s.key]){
          state.slots[s.key] = p;
          return true;
        }
        return false;
      };

      if (cat === 'Shield'){
        const mainFam = partFamilyIdOf(state.mainPart || null);
        const pickShieldSlot = (p) => {
          const pf = partFamilyIdOf(p);
          const pt = String((p && p.partType) || '').trim().toLowerCase();
          const code = String((p && p.code) || '').trim().toLowerCase();
          const isRarityPart = (pt === 'rarity') || /(^|[._])(comp_0[1-5]_|pearl_)/.test(code) || code.includes('.comp_');

          if (isRarityPart) return null;
          if (pf === 237) return slotByKey.get('armor237') || null;
          if (pf === 248) return slotByKey.get('energy248') || null;

          if (pf === 246){
            if (pt === 'firmware') return slotByKey.get('firmware246') || null;
            if (pt === 'perk'){
              if (code.includes('_primary')){
                return !state.slots.primary246
                  ? (slotByKey.get('primary246') || null)
                  : (slotByKey.get('secondary246') || null);
              }
              return !state.slots.secondary246
                ? (slotByKey.get('secondary246') || null)
                : (slotByKey.get('primary246') || null);
            }
            return slotByKey.get('resistance') || null;
          }

          if (Number.isFinite(mainFam) && Number.isFinite(pf) && pf === mainFam){
            if (!state.slots.mainBody) return slotByKey.get('mainBody') || null;
            return slotByKey.get('bodyLegendary') || null;
          }
          if (Number.isFinite(pf) && pf !== 237 && pf !== 246 && pf !== 248){
            if (!state.slots.mainBody) return slotByKey.get('mainBody') || null;
            return slotByKey.get('bodyLegendary') || null;
          }
          return null;
        };

        for (const p of partsLeft){
          const s = pickShieldSlot(p);
          if (!assignSlot(s, p)){
            state.extras.push(tokenForPart(p) || normCode(p.code));
          }
        }

        if (elementTokens.length && slotByKey.has('elementType1')){
          const tok = String(elementTokens[0].t || '').trim();
          const m = tok.match(/^\{\s*1\s*:\s*(\d+)\s*\}$/);
          if (m){
            const id = Number(m[1]);
            const elementRow = ELEMENTS.find(e => {
              const em = String((e && e.code) || '').match(/^\{\s*1\s*:\s*(\d+)\s*\}$/);
              return em && Number(em[1]) === id;
            });
            const fallbackCode = `{1:${id}}`;
            const pseudo = {
              category: 'Shield',
              manufacturer: state.manufacturer || '',
              partType: 'TypeID1Element',
              name: elementRow ? String(elementRow.label || `TypeID 1:${id}`) : `TypeID 1:${id}`,
              code: elementRow ? String(elementRow.code || fallbackCode) : fallbackCode,
              idRaw: `1:${id}`,
              family: 1,
              id
            };
            state.slots.elementType1 = pseudo;
          }
        }
      } else {
        for (const p of partsLeft){
          const matches = schema.filter(s => String(s.partType || '') === String((p && p.partType) || ''));
          let s = null;
          if (matches.length){
            s = matches.find(x => x.multi) || matches.find(x => !state.slots[x.key]) || matches[0];
          }
          if (!assignSlot(s, p)){
            state.extras.push(tokenForPart(p) || normCode(p.code));
          }
        }
      }
    }

    refreshBuilder();
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); }catch(_){}
      document.body.removeChild(ta);
      return false;
    }
  }

  /** Legit-style item slug — logic in assets/js/cc-item-slug.js (computeSimpleBuilderItemSlug). */
  function computeEditorItemSlug() {
    try {
      if (typeof window.computeSimpleBuilderItemSlug === 'function') {
        return window.computeSimpleBuilderItemSlug(state) || '';
      }
    } catch (_e) {}
    return '';
  }

  function syncBuildStatsItemSlug() {
    try {
      const slug = computeEditorItemSlug();
      try { window.__STX_ITEM_SLUG = slug || ''; } catch (_e) {}
      try {
        if (!window.selectedData || typeof window.selectedData !== 'object') window.selectedData = {};
        window.selectedData.itemSlug = slug || '';
        window.selectedData.editorItemContext = 'stx_simple_builder';
      } catch (_e) {}
      try {
        if (typeof window.refreshBuildStatsCore === 'function') {
          setTimeout(() => { try { window.refreshBuildStatsCore(); } catch (_e) {} }, 0);
        }
      } catch (_e) {}
    } catch (_e) {}
  }

  function wireEvents(){
    $('itemType').addEventListener('change', ()=>{
      clearImportedOutputLock();
      clearBuilderState(true);
      refreshManufacturer();
      refreshWeaponType();
      refreshRarity();
      refreshMainPart();
    });

    $('manufacturer').addEventListener('change', ()=>{
      clearImportedOutputLock();
      state.manufacturer = $('manufacturer').value || '';
      clearBuilderState(true);
      refreshWeaponType();
      refreshRarity();
      refreshMainPart();
    });

    $('weaponType').addEventListener('change', ()=>{
      clearImportedOutputLock();
      // Keep state in sync before downstream refresh (fixes Heavy Weapon rarity/main pools)
      state.weaponType = $('weaponType').value || '';
      if (state.weaponType === 'Heavy') state.weaponType = 'Heavy Weapon';
      clearBuilderState(true);
      // Weapon type does not change the manufacturer list; keep it stable to avoid empty/invalid states.
      refreshRarity();
      refreshMainPart();
    });

    $('level').addEventListener('change', ()=>{
      state.level = Number($('level').value||1);
      refreshOutputs();
    });
    $('level2').addEventListener('change', ()=>{
      state.level = Number($('level2').value||1);
      refreshOutputs();
    });

    $('rarity').addEventListener('change', (e)=>{
  if (e && e.isTrusted) state.__seedEnabled = true;
  state.rarity = $('rarity').value||'';
  // Rarity affects the core pool for several categories (notably Class Mods and Enhancements),
  // so rebuild the rarity-id part selector and dependent slots when it changes.
  refreshMainPart();
});

    if ($('skinSelect')){
      const resyncSkinCamo = ()=>{
        try{ syncSkinOptionsFromParent(); }catch(_){}
        try{ syncCamoOptionsFromParent(); }catch(_){}
      };
      const hasNumericGroup = ()=>{
        const ss = $('skinSelect');
        if (!ss) return false;
        try{
          const groups = Array.from(ss.querySelectorAll('optgroup') || []);
          for (const g of groups){
            if (!g) continue;
            if (String(g.label || '').trim().toLowerCase() !== 'numeric id skins') continue;
            if ((g.querySelectorAll('option') || []).length > 0) return true;
          }
        }catch(_){}
        return false;
      };
      const observeSourceSelect = (docObj, id)=>{
        try{
          const d = docObj || document;
          const src = d ? d.getElementById(id) : null;
          if (!src || src.__stxSkinSyncObsV1) return;
          const mo = new MutationObserver(()=>{ setTimeout(resyncSkinCamo, 0); });
          mo.observe(src, { childList:true, subtree:true });
          src.__stxSkinSyncObsV1 = mo;
        }catch(_){}
      };
      const observeSkinSources = ()=>{
        try{
          const pd = (window.parent && window.parent.document) ? window.parent.document : document;
          ['skin','skinCamo','mixSkin1','mixSkin2','mixSkin3'].forEach((id)=>observeSourceSelect(pd, id));
        }catch(_){}
      };

      $('skinSelect').addEventListener('change', ()=>{
        const synced = syncMainPartFromSkinSelection();
        if (!synced) refreshOutputs();
      });
      if ($('camoSelect')) $('camoSelect').addEventListener('change', ()=>refreshOutputs());
      resyncSkinCamo();
      syncMainPartFromSkinSelection();
      observeSkinSources();
      let tries = 0;
      const t = setInterval(()=>{ 
        tries++; 
        resyncSkinCamo();
        const skinReady = !!($('skinSelect').options && $('skinSelect').options.length > 1);
        const camoReady = !!(!$('camoSelect') || ($('camoSelect').options && $('camoSelect').options.length > 1));
        const numericReady = hasNumericGroup();
        if ((skinReady && camoReady && numericReady) || tries > 120) clearInterval(t);
      }, 150);
      setTimeout(resyncSkinCamo, 300);
      setTimeout(resyncSkinCamo, 900);
      setTimeout(resyncSkinCamo, 1800);
      setTimeout(resyncSkinCamo, 3500);
      setTimeout(observeSkinSources, 600);
      setTimeout(observeSkinSources, 2200);

      if (!window.__stxSkinSyncHooksV1){
        window.__stxSkinSyncHooksV1 = true;
        ['loadSkinOptions','populateMixDropdowns'].forEach((fnName)=>{
          const orig = window[fnName];
          if (typeof orig !== 'function' || orig.__stxSkinSyncWrappedV1) return;
          const wrapped = function(){
            const out = orig.apply(this, arguments);
            setTimeout(resyncSkinCamo, 0);
            setTimeout(observeSkinSources, 0);
            return out;
          };
          wrapped.__stxSkinSyncWrappedV1 = true;
          window[fnName] = wrapped;
        });
        window.addEventListener('load', ()=>{
          setTimeout(resyncSkinCamo, 0);
          setTimeout(resyncSkinCamo, 800);
          setTimeout(resyncSkinCamo, 2000);
          setTimeout(observeSkinSources, 0);
        });
      }
    }

    if ($('seedInput')){
      $('seedInput').addEventListener('input', (e)=>{
        if (e && e.isTrusted) state.__seedEnabled = true;
        const v = String($('seedInput').value || '').trim();
        if (!v){ state.seedAuto = null; state.seedKey = null; }
        refreshOutputs();
      });
    }

    $('mainPart').addEventListener('change', ()=>{
      // selecting main part resets builder state (slots etc.)
      state.slots = {};
      state.primaryElement = 'None';
      state.elementStack = [];
      state.extras = [];
      refreshBuilder();
      syncMainPartPreview();
    });

    const idModeEl = $('idMode');
    if (idModeEl){
      idModeEl.addEventListener('change', ()=>{
        state.idMode = !!idModeEl.checked;
        var ccPart = document.getElementById('ccPartEntryMode');
        if (ccPart) ccPart.checked = state.idMode;
        updateModeLabel();
        refreshTopSelectors();
        refreshBuilder();
        try { if (typeof window.syncGuidedVisibility === 'function') window.syncGuidedVisibility(); } catch (_) {}
        try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_) {}
      });
    }

    var ccPartMode = document.getElementById('ccPartEntryMode');
    if (ccPartMode){
      ccPartMode.addEventListener('change', ()=>{
        state.idMode = !!ccPartMode.checked;
        if ($('idMode')) $('idMode').checked = state.idMode;
        updateModeLabel();
        refreshTopSelectors();
        refreshBuilder();
        try { if (typeof window.syncGuidedVisibility === 'function') window.syncGuidedVisibility(); } catch (_) {}
        try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_) {}
      });
    }

    if ($('buybackFlag')) $('buybackFlag').addEventListener('change', ()=>{
      state.buybackFlag = $('buybackFlag').checked;
      refreshBuilder();
    });
    if ($('allPartsToggle')) $('allPartsToggle').addEventListener('change', ()=>{
      state.allParts = !!$('allPartsToggle').checked;
      clearBuilderState(true);
      refreshMainPart();
    });

    $('btnNew').addEventListener('click', ()=>resetAll());
    $('btnClear').addEventListener('click', ()=>clearParts());

    // Enable seed generation after the user interacts (prevents random seed on initial load).
    // Trusted events only (ignores programmatic changes).
    document.addEventListener('pointerdown', (e)=>{ if (e && e.isTrusted) state.__seedEnabled = true; }, true);
    document.addEventListener('keydown', (e)=>{ if (e && e.isTrusted) state.__seedEnabled = true; }, true);

    $('btnCopyList').addEventListener('click', async ()=>{
      await copyToClipboard($('outList').value||'');
    });
    $('btnCopyJson').addEventListener('click', async ()=>{
      await copyToClipboard($('outJson').value||'');
    });

    if ($('btnImport')) $('btnImport').addEventListener('click', ()=>importTokens());
  }

  function init(){
    const all = getAllParts();
    // attach __idx once
    for (let i=0;i<all.length;i++) all[i].__idx = i;

    {
      const idEl = $('idMode');
      if (idEl && typeof idEl.checked === 'boolean'){
        state.idMode = !!idEl.checked;
      } else {
        state.idMode = true;
        if (idEl) idEl.checked = true;
      }
      const ccEl = document.getElementById('ccPartEntryMode');
      if (ccEl) ccEl.checked = state.idMode;
    }
    // Buyback flag (appends "| 9, 1|" after level)
    state.buybackFlag = false;
    if ($('buybackFlag')) $('buybackFlag').checked = false;
    // Part pool scope (manufacturer-only vs all manufacturers)
    state.allParts = false;
    if ($('allPartsToggle')) $('allPartsToggle').checked = false;
    updateModeLabel();

    // Ensure level defaults are sane on first load (some browsers may ignore initial value in srcdoc).
    try{
      const lv = $('level');
      if (lv && (!String(lv.value||'').trim() || Number(lv.value) <= 1)) lv.value = '60';
      const lv2 = $('level2');
      if (lv2 && (!String(lv2.value||'').trim() || Number(lv2.value) <= 1)) lv2.value = '60';
      state.level = 60;
    }catch(_e){}

    refreshTopSelectors();
    wireEvents();
    refreshOutputs();

    // Expose for Guided Builder and other consumers
    try {
      window.getManufacturersForCategory = (catUi, weaponType) => {
        const r = computeManufacturersForCategory(catUi, weaponType);
        return r ? r.mans : [];
      };
      window.computeGuidedPrefix = computeGuidedPrefix;
      window.normalizeIdTokensForBaseFamily = normalizeIdTokensForBaseFamily;
      window.tokenForPart = tokenForPart;
      window.filterPartsForGuided = filterParts;
      window.classModFamilyIdForCharacter = classModFamilyIdForCharacter;
      window.getLegacyClassModNameParts = getLegacyClassModNameParts;
      window.importTokens = importTokens;
      if (typeof window.loadGuidedManufacturers === 'function') window.loadGuidedManufacturers();
      if (typeof window.refreshGuidedBuilderDropdowns === 'function') window.refreshGuidedBuilderDropdowns();
    } catch (_e) {}
  }

  // wait for dataset to load
  const wait = () => {
    if (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS) && window.STX_DATASET.ALL_PARTS.length){
      init();
    } else {
      $('dsStatus').textContent = 'waiting for dataset...';
      setTimeout(wait, 50);
    }
  };
  wait();
})();
