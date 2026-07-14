/**
 * Client-side cosmetics catalog sort (mirrors scripts/lib/cosmetic-sort.mjs).
 */
(function (global) {
  'use strict';

  var SKIN_KIND_ORDER = {
    weapon_mat: 0,
    weapon_skin_code: 1,
    phosphene: 2,
    completion: 3,
    pearlescent: 4,
    player_skin: 5,
    player_skin_filter: 6,
    player_head: 7,
    robodealer_body: 8,
    robodealer_head: 9,
    companion_skin: 10,
    companion_attachment: 11,
    vehicle_mat: 12,
    other: 13,
  };

  var VH_CLASS_ORDER = {
    DarkSiren: 0,
    ExoSoldier: 1,
    Gravitar: 2,
    Paladin: 3,
    RoboDealer: 4,
  };

  var SKIN_KIND_SECTION = {
    weapon_mat: 'Weapon material camos',
    weapon_skin_code: 'Legendary skin codes',
    phosphene: 'Phosphenes',
    completion: 'Completion skins',
    pearlescent: 'Pearlescents',
    player_skin: 'Player outfits',
    player_skin_filter: 'Player outfit filters',
    player_head: 'Player heads',
    robodealer_body: 'Claptrap bodies',
    robodealer_head: 'Claptrap heads',
    companion_skin: 'Companion skins',
    companion_attachment: 'Companion attachments',
    vehicle_mat: 'Vehicle paints',
    other: 'Other cosmetics',
  };

  function matNumFromCosmeticCode(cosmetic) {
    var m = String(cosmetic || '').match(/_Mat(\d{1,2})_/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function playerCosmeticMeta(cosmetic) {
    var c = String(cosmetic || '');
    var m = c.match(/^Cosmetics_(DarkSiren|ExoSoldier|Gravitar|Paladin|RoboDealer)_(Skin|SkinFilter|Head)(\d+)_/i);
    if (!m) return { classOrder: 99, index: 999 };
    return { classOrder: VH_CLASS_ORDER[m[1]] != null ? VH_CLASS_ORDER[m[1]] : 99, index: parseInt(m[3], 10) };
  }

  function robodealerMeta(cosmetic) {
    var m = String(cosmetic || '').match(/^Cosmetics_RoboDealer_(Body|Head)(\d+)_/i);
    if (!m) return { index: 999 };
    return { index: parseInt(m[2], 10) };
  }

  function companionMeta(cosmetic) {
    var m = String(cosmetic || '').match(/^Cosmetics_Echo4_(Skin|Attachment)(\d+)_/i);
    if (!m) return { index: 999 };
    return { index: parseInt(m[2], 10) };
  }

  function compareCosmeticRows(a, b, mode) {
    mode = mode || 'catalog';
    if (mode === 'name') {
      var byName = String(a.display_name || '').localeCompare(String(b.display_name || ''), undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return String(a.cosmetic || a.id || '').localeCompare(String(b.cosmetic || b.id || ''));
    }

    var ka = SKIN_KIND_ORDER[a.kind] != null ? SKIN_KIND_ORDER[a.kind] : 99;
    var kb = SKIN_KIND_ORDER[b.kind] != null ? SKIN_KIND_ORDER[b.kind] : 99;
    if (ka !== kb) return ka - kb;

    var matA = a.mat_num != null ? a.mat_num : matNumFromCosmeticCode(a.cosmetic);
    var matB = b.mat_num != null ? b.mat_num : matNumFromCosmeticCode(b.cosmetic);
    if (matA != null && matB != null && matA !== matB) return matA - matB;

    if (a.kind === 'player_skin' || a.kind === 'player_skin_filter' || a.kind === 'player_head') {
      var pa = playerCosmeticMeta(a.cosmetic);
      var pb = playerCosmeticMeta(b.cosmetic);
      if (pa.index !== pb.index) return pa.index - pb.index;
      if (pa.classOrder !== pb.classOrder) return pa.classOrder - pb.classOrder;
    }

    if (a.kind === 'robodealer_body' || a.kind === 'robodealer_head') {
      var ra = robodealerMeta(a.cosmetic);
      var rb = robodealerMeta(b.cosmetic);
      if (ra.index !== rb.index) return ra.index - rb.index;
    }

    if (a.kind === 'companion_skin' || a.kind === 'companion_attachment') {
      var ca = companionMeta(a.cosmetic);
      var cb = companionMeta(b.cosmetic);
      if (ca.index !== cb.index) return ca.index - cb.index;
    }

    return String(a.display_name || '').localeCompare(String(b.display_name || ''), undefined, { sensitivity: 'base' });
  }

  function skinKindSectionTitle(kind) {
    return SKIN_KIND_SECTION[kind] || kind || 'Cosmetics';
  }

  global.LootSkinSort = {
    SKIN_KIND_ORDER: SKIN_KIND_ORDER,
    SKIN_KIND_SECTION: SKIN_KIND_SECTION,
    compareCosmeticRows: compareCosmeticRows,
    skinKindSectionTitle: skinKindSectionTitle,
    matNumFromCosmeticCode: matNumFromCosmeticCode,
  };
})(typeof window !== 'undefined' ? window : globalThis);
