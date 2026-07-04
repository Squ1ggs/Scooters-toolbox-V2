/**
 * Normal enemy loot tiers + mob catalog — used by loot-reference.html.
 */
(function () {
  'use strict';

  var TIER_ORDER = [
    'Chump', 'Normal', 'Elite', 'Badass', 'BadassCorrupt', 'BadassSuper',
    'Loot', 'BossMini', 'Boss', 'BossRaid', 'BossVault',
  ];

  var TIER_INFO = {
    Chump: { label: 'Chump', blurb: 'Weakest fodder — lowest chance to drop gear.' },
    Normal: { label: 'Normal', blurb: 'Standard trash mobs in open combat.' },
    Elite: { label: 'Elite', blurb: 'Tougher variants with better generic loot odds.' },
    Badass: { label: 'Badass', blurb: 'Badass enemies — noticeably higher drop rates.' },
    BadassCorrupt: { label: 'Badass (Corrupt)', blurb: 'Corrupt badass tier — high generic loot.' },
    BadassSuper: { label: 'Badass Super', blurb: 'Super badass tier — among the best generic mob drops.' },
    Loot: { label: 'Loot piñata', blurb: 'Enemies flagged as loot-focused (piñata-style drops).' },
    BossMini: { label: 'Mini-boss (generic)', blurb: 'Generic mini-boss loot table — not the same as named dedicated boss pools.' },
    Boss: { label: 'Boss (generic)', blurb: 'Generic boss loot table — separate from named story/world bosses.' },
    BossRaid: { label: 'Raid boss (generic)', blurb: 'Raid-tier generic loot table.' },
    BossVault: { label: 'Vault boss (generic)', blurb: 'Vault encounter generic loot table.' },
  };

  var CATEGORY_LABELS = {
    guns: 'Guns',
    shields: 'Shields',
    grenadesgadgets: 'Grenades & gadgets',
    repkits: 'Repkits',
    enhancements: 'Enhancements',
    classmods: 'Class mods',
    currencyorammo: 'Cash & ammo',
    health: 'Health vials',
  };

  function buildTierIndex(rows) {
    var map = {};
    rows.forEach(function (row) {
      if (!row.name || map[row.name]) return;
      map[row.name] = row;
    });
    return map;
  }

  function pctFmt(prob) {
    if (!(typeof prob === 'number' && Number.isFinite(prob))) return null;
    var pct = prob * 100;
    if (pct >= 10) return Math.round(pct) + '%';
    if (pct >= 1) return pct.toFixed(1) + '%';
    return pct.toFixed(2) + '%';
  }

  function categoryKeyFromDrop(d) {
    var slot = String(d.prob_slot || '').toLowerCase();
    if (slot.indexOf('guns_') === 0) return 'guns';
    if (slot.indexOf('shields_') === 0) return 'shields';
    if (slot.indexOf('grenades') === 0 || slot.indexOf('gadgets') === 0) return 'grenadesgadgets';
    if (slot.indexOf('repkits_') === 0) return 'repkits';
    if (slot.indexOf('enhancements_') === 0) return 'enhancements';
    if (slot.indexOf('classmods_') === 0) return 'classmods';
    if (slot.indexOf('currencyorammo') === 0) return 'currencyorammo';
    if (d.prob_attribute === 'evaluator_healthweight') return 'health';
    var pool = String(d.itempool || d.label || '').toLowerCase();
    if (pool.indexOf('guns') >= 0) return 'guns';
    if (pool.indexOf('shield') >= 0) return 'shields';
    if (pool.indexOf('gadget') >= 0 || pool.indexOf('grenade') >= 0) return 'grenadesgadgets';
    if (pool.indexOf('repkit') >= 0) return 'repkits';
    if (pool.indexOf('enhancement') >= 0) return 'enhancements';
    if (pool.indexOf('class_mod') >= 0) return 'classmods';
    if (pool.indexOf('currency') >= 0 || pool.indexOf('ammo') >= 0) return 'currencyorammo';
    if (pool.indexOf('health') >= 0) return 'health';
    return null;
  }

  function isCombatActor(a) {
    var key = String(a.key || '');
    if (/^Char_NPC/i.test(key)) return false;
    if (/^Char_Creature_Pet/i.test(key)) return false;
    if (/^Char_Vehicle/i.test(key)) return false;
    if (/^Char_Prop/i.test(key)) return false;
    return true;
  }

  window.LootRefNormalEnemies = {
    init: function (opts) {
      var esc = opts.esc;
      var hay = opts.hay;
      var pctCell = opts.pctCell;
      var bindCopy = opts.bindCopy;
      var enemyTiers = opts.enemyTiers;
      var lootRef = opts.lootRef;
      var rarityData = opts.rarityData;
      var enemyRef = opts.enemyRef;
      var tierSummaryBody = opts.tierSummaryBody;
      var tierCards = opts.tierCards;
      var actorCards = opts.actorCards;
      var combatOnly = opts.combatOnly;
      var hideBossRank = opts.hideBossRank;
      var isTechnical = typeof opts.isTechnical === 'function' ? opts.isTechnical : function () { return false; };
      var formatActorHeading = typeof opts.formatActorHeading === 'function' ? opts.formatActorHeading : null;

      if (!enemyTiers || !lootRef) {
        return function () { return { summaryShown: 0, tierShown: 0, actorShown: 0 }; };
      }

      var tierByName = buildTierIndex(enemyTiers.rows || []);
      var baseLootPools = (lootRef.enemy_pools || []).filter(function (p) {
        return /^ItemPoolList_Enemy_BaseLoot_/i.test(p.itempool_list || '');
      });
      var poolByTier = {};
      baseLootPools.forEach(function (p) {
        var m = String(p.row_name || '').match(/^Enemy_BaseLoot_(.+)$/i);
        if (m) poolByTier[m[1]] = p;
      });
      var rarityByPool = {};
      (rarityData && rarityData.pools || []).forEach(function (p) {
        if (p.itempool) rarityByPool[String(p.itempool).toLowerCase()] = p;
      });

      function tierProbForCategory(tierRow, catKey) {
        if (!tierRow || !catKey) return null;
        return tierRow[catKey + '_probability'];
      }

      function tierHowManyForCategory(tierRow, catKey) {
        if (!tierRow || !catKey) return null;
        var v = tierRow[catKey + '_howmany_expected'];
        if (v == null) v = tierRow[catKey + '_howmany'];
        return v;
      }

      function poolKindPill(d) {
        if (d.kind === 'itempool') return '<span class="pill pill--gear">pool</span>';
        return '<span class="pill">' + esc(d.kind || 'drop') + '</span>';
      }

      function rarityHint(itempool) {
        var p = rarityByPool[String(itempool || '').toLowerCase()];
        if (!p) return '';
        var bits = [];
        if (p.tier) bits.push('<span class="pill pill--' + esc(p.tier) + '">' + esc(p.tier) + '</span>');
        if (p.category) bits.push('<span class="pill">' + esc(p.category) + '</span>');
        var childCount = (p.child_pools || []).length;
        if (childCount) bits.push('<span class="subtle">' + childCount + ' child pools</span>');
        var compCount = (p.inv_comps || []).length;
        if (compCount) bits.push('<span class="subtle">' + compCount + ' example comps</span>');
        return bits.length ? '<div class="drop-meta">' + bits.join(' ') + '</div>' : '';
      }

      function formatDropLine(d, tierRow) {
        var catKey = categoryKeyFromDrop(d);
        var catLabel = CATEGORY_LABELS[catKey] || d.label || 'Drop';
        var prob = tierProbForCategory(tierRow, catKey);
        var how = tierHowManyForCategory(tierRow, catKey);
        var pool = '';
        if (isTechnical() && d.itempool) {
          pool = '<code class="copyable" data-copy-label="Itempool">' + esc(d.itempool) + '</code>';
        }
        var pct = pctFmt(prob);
        var note = '';
        if (pct && how != null && Number.isFinite(how)) {
          note = '<span class="subtle">~' + pct + ' chance · ~' + Number(how).toFixed(2) + ' items when it drops</span>';
        } else if (pct) {
          note = '<span class="subtle">~' + pct + ' per kill (category roll)</span>';
        } else if (d.prob_attribute && isTechnical()) {
          note = '<span class="subtle">Weight from game attribute — not a flat %</span>';
        }
        return '<li>' + poolKindPill(d) + '<strong>' + esc(catLabel) + '</strong> ' + pool + note +
          (isTechnical() ? rarityHint(d.itempool) : '') + '</li>';
      }

      return function renderNormalEnemies(term) {
        var summaryShown = 0;
        var tierShown = 0;
        var actorShown = 0;

        if (tierSummaryBody) {
          tierSummaryBody.innerHTML = '';
          TIER_ORDER.forEach(function (name) {
            var row = tierByName[name];
            if (!row) return;
            if (term && hay([name, TIER_INFO[name] && TIER_INFO[name].label]).indexOf(term) === -1) return;
            summaryShown++;
            var tr = document.createElement('tr');
            tr.innerHTML =
              '<td><strong>' + esc((TIER_INFO[name] || {}).label || name) + '</strong>' +
              (isTechnical() ? '<div class="subtle">' + esc(name) + '</div>' : '') + '</td>' +
              '<td>' + pctCell(row.guns_probability, row.guns_howmany_expected != null ? row.guns_howmany_expected : row.guns_howmany) + '</td>' +
              '<td>' + pctCell(row.shields_probability, row.shields_howmany_expected != null ? row.shields_howmany_expected : row.shields_howmany) + '</td>' +
              '<td>' + pctCell(row.grenadesgadgets_probability, row.grenadesgadgets_howmany_expected != null ? row.grenadesgadgets_howmany_expected : row.grenadesgadgets_howmany) + '</td>' +
              '<td>' + pctCell(row.repkits_probability, row.repkits_howmany_expected != null ? row.repkits_howmany_expected : row.repkits_howmany) + '</td>' +
              '<td>' + pctCell(row.enhancements_probability, row.enhancements_howmany_expected != null ? row.enhancements_howmany_expected : row.enhancements_howmany) + '</td>' +
              '<td>' + pctCell(row.classmods_probability, row.classmods_howmany_expected != null ? row.classmods_howmany_expected : row.classmods_howmany) + '</td>';
            tierSummaryBody.appendChild(tr);
          });
        }

        if (tierCards) {
          tierCards.innerHTML = '';
          TIER_ORDER.forEach(function (name) {
            var row = tierByName[name];
            var pool = poolByTier[name];
            if (!row) return;
            var info = TIER_INFO[name] || { label: name, blurb: '' };
            var cardHay = hay([name, info.label, info.blurb, pool && pool.itempool_list, (pool && pool.drops || []).map(function (d) { return d.itempool; }).join(' ')]);
            if (term && cardHay.indexOf(term) === -1) return;
            tierShown++;
            var card = document.createElement('div');
            card.className = 'card';
            var drops = (pool && pool.drops) || [];
            var dropHtml = drops.length
              ? '<ul class="drop-list">' + drops.map(function (d) { return formatDropLine(d, row); }).join('') + '</ul>'
              : '<p class="subtle">No parsed pool entries in the current Nexus export.</p>';
            card.innerHTML =
              '<h3><span class="pill pill--world">Loot tier</span> ' + esc(info.label) +
              (isTechnical() ? ' <span class="subtle">Table_EnemyDrops · ' + esc(name) + '</span>' : '') + '</h3>' +
              '<p class="card-blurb">' + esc(info.blurb) + '</p>' +
              (pool && isTechnical()
                ? '<div class="meta-grid"><div>Rolls from <code>' + esc(pool.itempool_list) + '</code></div></div>'
                : '') +
              dropHtml +
              '<details class="tech-details"><summary>What these numbers mean</summary>' +
              '<p class="subtle">Each percentage is the chance that category rolls when an enemy of this tier dies. ' +
              'Guns, shields, and other categories then pull from shared pools (common through legendary' +
              (isTechnical() ? ' — see the <strong>Pool rarities</strong> tab' : '') + ').</p></details>';
            tierCards.appendChild(card);
          });
          bindCopy(tierCards);
        }

        if (actorCards && enemyRef && enemyRef.actors) {
          actorCards.innerHTML = '';
          var combat = combatOnly && combatOnly.checked;
          var noBoss = hideBossRank && hideBossRank.checked;
          var limit = 120;
          enemyRef.actors.forEach(function (a) {
            if (a.dedicated_drop) return;
            if (combat && !isCombatActor(a)) return;
            if (noBoss && a.is_boss) return;
            if (!a.display_name) return;
            var cardHay = hay([a.display_name, a.key, a.balance_row, a.parent_actor, a.ai_category]);
            if (term && cardHay.indexOf(term) === -1) return;
            if (actorShown >= limit) return;
            actorShown++;
            var card = document.createElement('div');
            card.className = 'card card--actor';
            var pills = '<span class="pill pill--gear">mob</span>';
            if (a.is_boss) pills += '<span class="pill pill--world">boss rank</span>';
            if (isTechnical() && a.balance_row) pills += '<span class="pill">balance: ' + esc(a.balance_row) + '</span>';
            card.innerHTML =
              (formatActorHeading
                ? formatActorHeading(a, pills + ' ')
                : '<h3>' + pills + ' ' + esc(a.display_name) + '</h3>') +
              '<p class="subtle">Uses generic loot tiers above — not a named dedicated drop boss. ' +
              'We do not map this mob to a specific Chump/Normal/Badass row yet.</p>' +
              (isTechnical() && !formatActorHeading
                ? '<details class="tech-details"><summary>Technical IDs</summary>' +
                  '<div class="meta-grid">' +
                  '<div>Actor: <code class="copyable" data-copy-label="Actor">' + esc(a.key) + '</code></div>' +
                  (a.parent_actor ? '<div>Parent: <code>' + esc(a.parent_actor) + '</code></div>' : '') +
                  (a.balance_row ? '<div>Balance row: <code>' + esc(a.balance_row) + '</code> <span class="subtle">(internal)</span></div>' : '') +
                  '</div></details>'
                : '');
            actorCards.appendChild(card);
          });
          if (actorShown >= limit) {
            var more = document.createElement('p');
            more.className = 'subtle';
            more.textContent = 'Showing first ' + limit + ' matches — refine your search to narrow results.';
            actorCards.appendChild(more);
          }
          bindCopy(actorCards);
        }

        return { summaryShown: summaryShown, tierShown: tierShown, actorShown: actorShown };
      };
    },
  };
})();
