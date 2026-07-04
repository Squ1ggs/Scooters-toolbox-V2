/**
 * Client-side rescale of boss dedicated-drop % for UVH / Mayhem level.
 * Data is baked at UVH 0; use drop_prob_share + slot_prob_base + slot_scalar.
 */
(function (global) {
  'use strict';

  var SCALAR_ROW_BY_TABLE = {
    Table_DedicatedDropProbability: 'UVH_Scalar',
    Table_DedicatedDropProbability_Raid1: 'Mayhem_Scalar',
    Table_DedicatedDropProbability_Raid2: 'Mayhem_Scalar',
    Table_DedicatedDropProbability_Tuba: 'Mayhem_Scalar',
  };

  var TABLE_LABELS = {
    Table_DedicatedDropProbability: 'Campaign',
    Table_DedicatedDropProbability_Raid1: 'Raid 1 / Mayhem',
    Table_DedicatedDropProbability_Raid2: 'Raid 2',
    Table_DedicatedDropProbability_Tuba: 'Tuba / raid event',
  };

  function formatProbPct(prob, digits) {
    if (!(typeof prob === 'number' && Number.isFinite(prob))) return null;
    var pct = prob * 100;
    var d = digits == null ? 2 : digits;
    if (pct >= 10) return Math.round(pct) + '%';
    if (pct >= 1) return pct.toFixed(1) + '%';
    return pct.toFixed(d) + '%';
  }

  function isScalableDrop(d) {
    if (!d || d.drop_prob_status !== 'calculated') return false;
    if (!(typeof d.drop_prob_share === 'number' && Number.isFinite(d.drop_prob_share))) return false;
    if (!(typeof d.slot_prob_base === 'number' && Number.isFinite(d.slot_prob_base))) return false;
    return /^Table_DedicatedDropProbability/.test(String(d.prob_datatable || ''));
  }

  function scaledSlotProb(d, uvhLevel) {
    var base = d.slot_prob_base;
    if (!(typeof base === 'number' && Number.isFinite(base))) return null;
    var level = Math.max(0, Math.floor(Number(uvhLevel) || 0));
    var scalar = typeof d.slot_scalar === 'number' && Number.isFinite(d.slot_scalar) ? d.slot_scalar : 0;
    return base + level * scalar;
  }

  function scaledDropProb(d, ctx) {
    ctx = ctx || {};
    if (!isScalableDrop(d)) {
      return typeof d.drop_prob === 'number' && Number.isFinite(d.drop_prob) ? d.drop_prob : null;
    }
    var slot = scaledSlotProb(d, ctx.uvhLevel || 0);
    if (slot == null) return d.drop_prob_base != null ? d.drop_prob_base : d.drop_prob;
    return slot * d.drop_prob_share;
  }

  function tableLabel(datatable) {
    return TABLE_LABELS[datatable] || datatable || 'Dedicated drop';
  }

  function scaleHint(d, ctx) {
    ctx = ctx || {};
    var level = Math.max(0, Math.floor(Number(ctx.uvhLevel) || 0));
    if (!isScalableDrop(d) || level <= 0) return '';
    var base = d.drop_prob_base != null ? d.drop_prob_base : d.drop_prob;
    var scaled = scaledDropProb(d, ctx);
    if (base == null || scaled == null) return '';
    var bits = [
      'UVH 0: ≈' + formatProbPct(base),
      'UVH ' + level + ': ≈' + formatProbPct(scaled),
    ];
    if (d.prob_datatable) bits.push(tableLabel(d.prob_datatable) + ' table');
    if (typeof d.slot_scalar === 'number' && Number.isFinite(d.slot_scalar)) {
      bits.push('slot +' + formatProbPct(d.slot_scalar, 3) + ' per UVH level');
    }
    return bits.join(' · ');
  }

  global.LootDropProbScale = {
    SCALAR_ROW_BY_TABLE: SCALAR_ROW_BY_TABLE,
    TABLE_LABELS: TABLE_LABELS,
    formatProbPct: formatProbPct,
    isScalableDrop: isScalableDrop,
    scaledSlotProb: scaledSlotProb,
    scaledDropProb: scaledDropProb,
    tableLabel: tableLabel,
    scaleHint: scaleHint,
  };
})(typeof window !== 'undefined' ? window : globalThis);
