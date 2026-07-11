/**
 * cc-itempool-drop-check.js
 * Resolves drop sources for decoded items by matching against SOURCE_PATHS_DATA.by_itempool
 * and LOOT_REFERENCE_DATA (challenge / campaign / boss notes when the shiny pool is absent
 * from the hub-only source graph).
 *
 * Requires: window.SOURCE_PATHS_DATA (from source_paths_data.js)
 * Optional: window.LOOT_REFERENCE_DATA (from loot_reference_data.js)
 */
(function () {
  "use strict";

  const GUN_WEAPONS = new Set(["ar", "ps", "sg", "sr", "sm"]);
  const MFR_PREFIX = /^([A-Z]{3})_([A-Z]{2})$/i;

  function normComp(comp) {
    return String(comp || "")
      .trim()
      .toLowerCase()
      .replace(/^inv'/i, "")
      .replace(/'$/, "");
  }

  function findLootGun(prefix, slug) {
    const lootRef = typeof window !== "undefined" && window.LOOT_REFERENCE_DATA;
    const guns = lootRef && Array.isArray(lootRef.shiny_guns) ? lootRef.shiny_guns : null;
    if (!guns || !slug) return null;
    const wantComp = prefix ? normComp(prefix + ".comp_05_legendary_" + slug) : null;
    const slugKey = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, "");

    let best = null;
    for (const g of guns) {
      if (g.pearl || g.variant === "pearl" || g.community_pearl) continue;
      const gComp = normComp(g.comp);
      if (wantComp && gComp === wantComp) return g;
      const gSlug = String(g.slug || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
      if (gSlug && gSlug === slugKey) best = best || g;
      if (gComp && gComp.endsWith("comp_05_legendary_" + String(slug).toLowerCase())) best = best || g;
    }
    return best;
  }

  function lootGunDropText(gun) {
    if (!gun) return null;
    const bosses = (gun.drop_sources || []).map((d) => d.enemy_name).filter(Boolean);
    if (bosses.length) return "Drops from: " + bosses.join(", ");
    const hints = (gun.source_hints || []).map((h) => h.label).filter(Boolean);
    if (hints.length) return hints.join(" · ");
    if (gun.drop_note) return String(gun.drop_note);
    if (gun.acquisition_kind === "challenge" || gun.acquisition_kind === "collection_challenge") {
      return "Challenge / collection unlock (see loot reference)";
    }
    if (gun.acquisition_kind === "campaign_unlock") return "Campaign shiny unlock";
    if (gun.acquisition_kind === "takedown") return "Takedown reward (see loot reference)";
    if (gun.acquisition_kind === "event") return "Playlist or event drop";
    return null;
  }

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
    const entry = data.by_itempool[key] || data.by_itempool[key.toLowerCase()];
    const lootGun = findLootGun(prefix, slug);
    const lootText = lootGunDropText(lootGun);

    if (!entry) {
      // Known phosphene acquisition without a source_paths itempool row (DLC merge gap,
      // challenge unlock, event, etc.) — not the same as a fabricated Modded serial.
      if (lootText) return lootText;
      if (lootGun) return "In loot reference (no boss pool row)";
      return "Modded";
    }

    const sources = [];
    if (Array.isArray(entry.from_itempoollist) && entry.from_itempoollist.length) {
      const names = entry.from_itempoollist.map((n) => String(n).replace(/^ItemPoolList_/, ""));
      sources.push("Boss/enemy pools: " + names.join(", "));
    }
    if (lootGun && lootGun.drop_sources && lootGun.drop_sources.length) {
      sources.push("Drops from: " + lootGun.drop_sources.map((d) => d.enemy_name).join(", "));
    } else if (lootText && !sources.length) {
      sources.push(lootText);
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
