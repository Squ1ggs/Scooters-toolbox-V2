/**
 * cc-itempool-drop-check.js
 * Resolves drop sources for decoded items by matching against SOURCE_PATHS_DATA.by_itempool.
 * Only shows "Drops from: …" when a full serial matches a known droppable itempool;
 * otherwise returns "Modded" or "Not in loot pool".
 *
 * Requires: window.SOURCE_PATHS_DATA (from source_paths_data.js)
 */
(function () {
  "use strict";

  const GUN_WEAPONS = new Set(["ar", "ps", "sg", "sr", "sm"]);
  const MFR_PREFIX = /^([A-Z]{3})_([A-Z]{2})$/i;

  /**
   * @param {Object} result - Decoded result { manufacturer, itemType, itemTypeId, parts }
   * @param {Array} resolvedParts - Resolved part objects with alpha_code
   * @returns {string} Drop source text or "Modded" / "—"
   */
  function getDropSource(result, resolvedParts) {
    const data = typeof window !== "undefined" && window.SOURCE_PATHS_DATA;
    if (!data || !data.by_itempool) return "—";

    if (!result || !result.success) return "—";

    let slug = null;
    let prefix = null;

    for (const p of resolvedParts || []) {
      const ac = String(p.alpha_code || "").trim();
      const m = ac.match(/\.comp_05_legendary_([a-zA-Z0-9_]+)$/);
      if (!m) continue;
      slug = m[1].toLowerCase();
      const dot = ac.indexOf(".comp_05_legendary_");
      if (dot > 0) prefix = ac.slice(0, dot);
      break;
    }

    if (!slug || !prefix) return "—";

    const pm = String(prefix).match(MFR_PREFIX);
    if (!pm) return "—";

    const mfr = pm[1].toLowerCase();
    const weapon = pm[2].toLowerCase();
    if (!GUN_WEAPONS.has(weapon)) return "—";

    const key = "itempool_" + mfr + "_" + weapon + "_05_legendary_" + slug + "_shiny";
    const entry = data.by_itempool[key];
    if (!entry) return "Modded";

    const sources = [];
    if (Array.isArray(entry.from_itempoollist) && entry.from_itempoollist.length) {
      const names = entry.from_itempoollist.map((n) => String(n).replace(/^ItemPoolList_/, ""));
      sources.push("Pools: " + names.join(", "));
    }
    if (Array.isArray(entry.loot_configs) && entry.loot_configs.length) {
      sources.push("Loot: " + entry.loot_configs.length + " config(s)");
    }
    if (Array.isArray(entry.vending_entries) && entry.vending_entries.length) {
      sources.push("Vending: " + entry.vending_entries.length);
    }

    return sources.length ? sources.join(" • ") : "In loot pool";
  }

  window.CC_ITEMPOOL_DROP_CHECK = { getDropSource };
})();
