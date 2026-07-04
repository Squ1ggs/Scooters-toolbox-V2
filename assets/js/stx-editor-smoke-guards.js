/**
 * stx-editor-smoke-guards.js — non-visual regression guards for Simple + Guided editors.
 * Loads with guided scripts. Console-only warnings; no UI changes.
 */
(function () {
  'use strict';

  var EDITOR_GUARD_SLOTS = [
    { manufacturer: 'Jakobs', weaponType: 'Assault Rifle', slotKey: 'bodyAcc', minOptions: 4 },
    { manufacturer: 'Jakobs', weaponType: 'Assault Rifle', slotKey: 'body', minOptions: 1 },
    { manufacturer: 'Jakobs', weaponType: 'Assault Rifle', slotKey: 'rarity', minOptions: 1 },
    { manufacturer: 'Jakobs', weaponType: 'Assault Rifle', slotKey: 'element', minOptions: 4 }
  ];

  var WEAPON_SLOT_SELECT = {
    rarity: 'ccRaritySelect',
    body: 'ccBodySelect',
    bodyAcc: 'ccBodyAccSelect',
    element: 'ccElementPartSelect'
  };

  function countRealSelectOptions(sel) {
    if (!sel || !sel.options) return 0;
    var n = 0;
    for (var i = 0; i < sel.options.length; i++) {
      var v = String(sel.options[i].value || '').trim();
      if (v) n++;
    }
    return n;
  }

  function slotKeysFromGuidedWeaponSlots() {
    if (typeof window.getGuidedWeaponSlots !== 'function') return [];
    try {
      return (window.getGuidedWeaponSlots() || []).map(function (r) { return r.key; });
    } catch (_) {
      return [];
    }
  }

  function assertGuidedWeaponSlotSchema() {
    var keys = slotKeysFromGuidedWeaponSlots();
    if (!keys.length) return { ok: true, skipped: true };
    var missing = [];
    if (keys.indexOf('rarity') === -1) missing.push('rarity');
    if (keys.indexOf('element') === -1) missing.push('element');
    if (missing.length) {
      return { ok: false, detail: 'getGuidedWeaponSlots missing: ' + missing.join(', ') };
    }
    return { ok: true };
  }

  function guardWeaponDropdowns(ctx) {
    ctx = ctx || {};
    var itemLo = String(ctx.itemType || '').trim().toLowerCase();
    if (itemLo !== 'weapon' && itemLo !== 'heavy weapon' && itemLo !== 'heavy') {
      return { ok: true, skipped: true };
    }
    var man = String(ctx.manufacturer || '').trim();
    var wt = String(ctx.weaponType || '').trim();
    if (!man || !wt) return { ok: true, skipped: true };

    var schema = assertGuidedWeaponSlotSchema();
    if (!schema.ok) return schema;

    var failures = [];
    for (var i = 0; i < EDITOR_GUARD_SLOTS.length; i++) {
      var rule = EDITOR_GUARD_SLOTS[i];
      if (rule.manufacturer.toLowerCase() !== man.toLowerCase()) continue;
      if (rule.weaponType.toLowerCase() !== wt.toLowerCase()) continue;
      var selId = WEAPON_SLOT_SELECT[rule.slotKey];
      if (!selId) continue;
      var sel = document.getElementById(selId);
      if (!sel) continue;
      var row = sel.closest && sel.closest('.cc-slot-row, .cc-guided-slot-row, tr, .form-row');
      if (row && row.style && row.style.display === 'none') continue;
      var count = countRealSelectOptions(sel);
      if (count < rule.minOptions) {
        failures.push(rule.slotKey + '=' + count + ' (need>=' + rule.minOptions + ')');
      }
    }
    if (failures.length) {
      return { ok: false, detail: man + ' ' + wt + ': ' + failures.join('; ') };
    }
    return { ok: true };
  }

  function warnGuard(label, result) {
    if (!result || result.ok || result.skipped) return;
    try {
      console.warn('[STX editor guard]', label + ':', result.detail || 'failed');
    } catch (_) {}
  }

  window.__stxEditorGuardWeaponDropdowns = function (ctx) {
    var result = guardWeaponDropdowns(ctx);
    warnGuard('weapon dropdowns', result);
    return result;
  };

  window.__stxEditorSmokeRun = function () {
    var checks = [];
    checks.push({ name: 'ncsNameToStateKey(rarity)', ok: typeof window.ncsNameToStateKey === 'function' && window.ncsNameToStateKey('rarity') === 'rarity' });
    checks.push({ name: 'getGuidedWeaponSlots exported', ok: typeof window.getGuidedWeaponSlots === 'function' });
    checks.push({ name: 'filterPartsForGuided exported', ok: typeof window.filterPartsForGuided === 'function' });
    checks.push({ name: '__ccWrapGuidedSelect exported', ok: typeof window.__ccWrapGuidedSelect === 'function' });
    checks.push({ name: 'guided slot schema', result: assertGuidedWeaponSlotSchema() });

    var ctx = {};
    try {
      if (typeof window.getGuidedFilterContext === 'function') ctx = window.getGuidedFilterContext();
    } catch (_) {}
    if (!ctx || !ctx.manufacturer) {
      var gMan = document.getElementById('ccGuidedManufacturer');
      var gWt = document.getElementById('ccGuidedWeaponType');
      var gItem = document.getElementById('ccGuidedItemType');
      function readSel(s) {
        if (!s) return '';
        var v = String(s.value || '').trim();
        if (v) return v;
        try {
          if (s.selectedIndex >= 0 && s.options[s.selectedIndex]) {
            return String(s.options[s.selectedIndex].value || '').trim();
          }
        } catch (_) {}
        return '';
      }
      ctx = {
        itemType: readSel(gItem) || (window.state && window.state.itemType) || '',
        manufacturer: readSel(gMan) || (window.state && window.state.manufacturer) || '',
        weaponType: readSel(gWt) || (window.state && window.state.weaponType) || ''
      };
    }
    checks.push({ name: 'weapon dropdown anchors', result: guardWeaponDropdowns(ctx) });

    var failed = 0;
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      var ok = c.ok != null ? c.ok : (c.result && (c.result.ok || c.result.skipped));
      if (!ok) failed++;
    }
    return { passed: checks.length - failed, total: checks.length, checks: checks, ctx: ctx };
  };

  try {
    window.addEventListener('stx:guided-scripts-ready', function () {
      var r = assertGuidedWeaponSlotSchema();
      if (!r.ok && !r.skipped) warnGuard('guided slot schema', r);
    });
  } catch (_) {}
})();
