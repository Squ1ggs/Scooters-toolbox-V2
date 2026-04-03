/**
 * Tag-based part validity from inv/comp dump fields (addtags, dependencytags, exclusiontags).
 * Rules are explicit and owned by this repo.
 *
 * See docs/TAG_BASED_VALIDATION.md for Nexus file map and optional INV_COMP_TAG_DATA bundle.
 */
(function () {
  'use strict';

  /**
   * @param {unknown} tags
   * @returns {string[]}
   */
  /**
   * Nexus inv dumps wrap each tag as { __typeFlags, value: { tagKey: "tagKey" } }.
   * Do not use Object.values(t) — __typeFlags is often first and becomes bogus tags like "641".
   */
  function formatTags(tags) {
    if (!tags || !Array.isArray(tags)) return [];
    var out = [];
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      if (t == null) continue;
      if (typeof t === 'object' && t !== null) {
        var inner = t.value !== undefined ? t.value : t;
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
          var keys = Object.keys(inner).filter(function (k) { return k.indexOf('__') !== 0; });
          if (keys.length) {
            var k0 = keys[0];
            var v = inner[k0];
            out.push(v != null && typeof v !== 'object' ? String(v) : String(k0));
          }
        } else if (inner !== undefined && inner !== null) {
          out.push(String(inner));
        }
      } else {
        out.push(String(t));
      }
    }
    return out.map(function (x) { return String(x).toLowerCase().trim(); }).filter(Boolean);
  }

  /**
   * @param {string[]} tags
   * @returns {Set<string>}
   */
  function toSet(tags) {
    var s = new Set();
    for (var i = 0; i < tags.length; i++) s.add(tags[i]);
    return s;
  }

  var RARITY_TAGS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  /**
   * @param {{ addtags?: unknown, dependencytags?: unknown, exclusiontags?: unknown, name?: string }} part
   * @param {Set<string>} tagPool — lowercased tags currently in pool (incl. comp + prior parts)
   * @param {{ skipUniqueExclusion?: boolean, skipExclusionTags?: string[], ignoreDependencyTags?: string[], skipAllDependencyChecks?: boolean, skipRarityPoolMatch?: boolean }} [options] — skipAllDependencyChecks: skip dependencytags entirely (bulk/editor parity — editors merge inv rows but do not simulate the comp tag pool, so uni_x/leg_x deps are never satisfied). skipRarityPoolMatch: save-editor-style bulk — do not fail on rarity tier mismatch vs pool (noisy with named comps).
   * @returns {{ ok: boolean, reasons: string[] }}
   */
  function partValidForPool(part, tagPool, options) {
    options = options || {};
    var reasons = [];
    if (!part || !tagPool) return { ok: true, reasons: [] };

    var addTags = toSet(formatTags(part.addtags));
    var depTags = toSet(formatTags(part.dependencytags));
    var exclTags = toSet(formatTags(part.exclusiontags));
    var skipEx = options.skipExclusionTags;
    var skipExSet = skipEx && skipEx.length ? skipEx : null;

    /* Exclusion: pool already has t, and this part does not add t → conflict.
       When evaluating a *candidate* whose addtags are not in the pool yet, build a temp pool
       or run a second pass after tag propagation (caller responsibility). */
    exclTags.forEach(function (t) {
      if (options.skipUniqueExclusion === true && t === 'unique') return;
      if (skipExSet && skipExSet.indexOf(t) >= 0) return;
      if (tagPool.has(t) && !addTags.has(t)) {
        reasons.push('exclusion tag "' + t + '" in pool');
      }
    });

    if (!options.skipAllDependencyChecks) {
      var ignDep = options.ignoreDependencyTags;
      var ignDepSet = ignDep && ignDep.length ? ignDep : null;
      depTags.forEach(function (t) {
        if (ignDepSet && ignDepSet.indexOf(t) >= 0) return;
        if (tagPool.has(t)) return;
        /* Nexus rows sometimes encode the same named legendary family with uni_* vs leg_*.
           Accept either prefix when the suffix matches (e.g. uni_king <-> leg_king). */
        if (t.indexOf('uni_') === 0) {
          var altLeg = 'leg_' + t.slice(4);
          if (tagPool.has(altLeg)) return;
        } else if (t.indexOf('leg_') === 0) {
          var altUni = 'uni_' + t.slice(4);
          if (tagPool.has(altUni)) return;
        }
        reasons.push('missing dependency tag "' + t + '"');
      });
    }

    var poolRarities = [];
    tagPool.forEach(function (t) {
      if (RARITY_TAGS.indexOf(t) >= 0) poolRarities.push(t);
    });
    var partRarities = [];
    addTags.forEach(function (t) {
      if (RARITY_TAGS.indexOf(t) >= 0) partRarities.push(t);
    });
    var poolHasUnique = tagPool.has('unique');
    var partHasUnique = addTags.has('unique');
    if (!options.skipRarityPoolMatch && poolRarities.length > 0 && !poolHasUnique && !partHasUnique && partRarities.length > 0) {
      var match = partRarities.some(function (pr) { return poolRarities.indexOf(pr) >= 0; });
      if (!match) reasons.push('rarity tags do not match pool');
    }

    return { ok: reasons.length === 0, reasons: reasons };
  }

  /**
   * @param {Set<string>} tagPool — mutated
   * @param {{ addtags?: unknown }} part
   */
  function applyPartAddTagsToPool(tagPool, part) {
    if (!part || !tagPool) return;
    formatTags(part.addtags).forEach(function (t) { tagPool.add(t); });
  }

  window.TagCompValidation = {
    formatTags: formatTags,
    partValidForPool: partValidForPool,
    applyPartAddTagsToPool: applyPartAddTagsToPool,
    RARITY_TAGS: RARITY_TAGS.slice()
  };
})();
