(function () {
  'use strict';
  var poolCache = new WeakMap();
  function check(decoded, data) {
    data = data || window.EXACT_ROLL_DATA;
    if (!data || !decoded || !decoded.success) return { failures:[], missing:['Exact roll definitions unavailable'], evidence:[] };
    var failures = [], missing = [], evidence = [], parts = [], diagnostics = [], selectionChecks = [], familyChecks = [], compatibilityChecks = [];
    var raw = String(decoded.deserialized || '');
    var rootId = decoded.itemTypeId;
    var token = /\{(\d+)(?::(?:\[([\d\s,]+)\]|(\d+)))?\}|"([a-z0-9_]+\.[a-z0-9_]+)"/gi;
    var match;
    while ((match = token.exec(raw))) {
      var keys = match[4] ? [match[4].toLowerCase()] : match[2] ? match[2].trim().split(/[\s,]+/).map(function (n) { return match[1] + ':' + n; }) : [match[3] != null ? match[1] + ':' + match[3] : rootId + ':' + match[1]];
      keys.forEach(function (key) {
        var spawn = data.ids[key] || key;
        if (!data.nodes[spawn]) { missing.push('No game definition for ' + key); return; }
        parts.push({key:key, spawn:spawn, node:data.nodes[spawn]});
      });
    }
    // This native invariant does not require a resolved rarity composition.
    // Apply it before the incomplete-composition return, too: unknown UI/type
    // coverage cannot make hundreds of the same resolved part legitimate.
    var nativeAlgorithm = data.selectionDefaults && data.selectionDefaults.evidence && data.selectionDefaults.evidence.algorithm;
    if (nativeAlgorithm && nativeAlgorithm.interpretation.selected_part_removed_before_next_draw) {
      var repeated = {};
      parts.forEach(function (part) {
        if (part.node.slot !== 'inv_comp') repeated[part.spawn] = (repeated[part.spawn] || 0) + 1;
      });
      Object.keys(repeated).forEach(function (spawn) {
        if (repeated[spawn] < 2) return;
        var slot = data.nodes[spawn].slot;
        failures.push('Duplicate ' + slot.replace(/_/g,' ').replace(/\bacc\b/g,'accessory') + ' part: ' + spawn + ' appears ' + repeated[spawn] + ' times; each part can be selected only once.');
      });
    }
    var firmware = parts.filter(function (p) { return p.node.slot === 'firmware'; });
    if (firmware.length > 1) failures.push('Firmware: found ' + firmware.length + '; only one can roll.');
    if (firmware.length && Number(decoded.level) < 25) failures.push('Firmware requires item level 25; this item is level ' + decoded.level + ' (' + firmware.map(function (p) {return p.spawn;}).join(', ') + ').');
    var compositions = parts.filter(function (p) { return p.node.slot === 'inv_comp'; });
    if (compositions.length !== 1) {
      if (!compositions.length) missing.push('No exact rarity composition resolved');
      else failures.push('Found ' + compositions.length + ' rarity compositions; only one can roll.');
      return {failures:failures, missing:missing, evidence:evidence,firmwareParts:firmware.map(function (p) {return p.spawn;})};
    }
    function resolveNode(spawn, visited) {
      if (!spawn || visited[spawn]) return null;
      visited[spawn] = true;
      if (data.nodes[spawn]) return data.nodes[spawn];
      var dot = spawn.indexOf('.'), root = spawn.slice(0,dot), name = spawn.slice(dot+1);
      return data.roots[root] && data.roots[root].parent ? resolveNode(data.roots[root].parent + '.' + name, visited) : null;
    }
    var rules = {}, ruleOrigins = {}, chain = [], active = {};
    function inherit(node) {
      if (!node || active[node.root + '.' + node.name]) return;
      active[node.root + '.' + node.name] = true;
      if (node.parent) {
        var parent = resolveNode(node.parent, {});
        if (!parent) missing.push('Missing inherited composition ' + node.parent);
        else inherit(parent);
      }
      chain.push(node.root + '.' + node.name);
      Object.keys(node.rules || {}).forEach(function (slot) {
        var child = node.rules[slot];
        // Native constructor plus lookup at 0x140a96514: omitted counts are 1/1.
        // Lookup returns the whole child entry before considering its parent.
        rules[slot] = Object.assign({min:1,max:1}, child);
        ruleOrigins[slot] = node.root + '.' + node.name;
      });
    }
    inherit(compositions[0].node);
    var inheritedTags = [];
    chain.forEach(function (spawn) { inheritedTags = inheritedTags.concat(data.nodes[spawn].tags || []); });
    if (inheritedTags.indexOf('npc_weapon') >= 0) failures.push('NPC-only weapon: ' + compositions[0].spawn + ' carries the game tag npc_weapon.');
    var bySlot = {};
    parts.forEach(function (p) {
      if (p.node.slot === 'inv_comp') return;
      (bySlot[p.node.slot] || (bySlot[p.node.slot] = [])).push(p);
    });
    Object.keys(rules).forEach(function (slot) {
      var rule = rules[slot], found = bySlot[slot] || [];
      if (rule.max != null && found.length > rule.max) failures.push(slot + ': ' + found.length + ' parts; game maximum is ' + rule.max + ' (' + found.map(function (p) {return p.spawn;}).join(', ') + ').');
      // Minima can be conditional on a selected part's criteria/chance and
      // cannot be treated as unconditional bans using the composition alone.
      if (rule.min != null && found.length < rule.min) diagnostics.push(slot + ': ' + found.length + ' parts; selection minimum ' + rule.min + ' requires criteria evaluation.');
      if (rule.parts && rule.parts.length) found.forEach(function (p) {
        if (!rule.parts.some(function (allowed) {return allowed.indexOf('.') >= 0 ? allowed === p.spawn : allowed === p.node.name;})) failures.push(slot + ': ' + p.spawn + ' is not allowed by ' + compositions[0].spawn + '.');
      });
    });
    evidence.push('Exact composition: ' + chain.join(' → '));
    var tagPool = new Set(inheritedTags);
    parts.forEach(function (p) { (p.node.add || []).forEach(function (t) { tagPool.add(t); }); });
    parts.forEach(function (p) {
      (p.node.deps || []).forEach(function (t) {
        if (!tagPool.has(t)) {
          // This direction is explicitly present on the accessory definition.
          // It does not imply that every Torgue magazine must select an accessory.
          if (t === 'tor_mag') failures.push('Torgue magazine accessory requires a Torgue magazine (' + p.spawn + ').');
          else if (p.node.slot === 'passive_points') failures.push('Class mod skill point is missing a prerequisite tier or skill (' + p.spawn + ': ' + t + ').');
          else diagnostics.push(p.spawn + ': missing dependency tag ' + t);
        }
      });
      (p.node.excludes || []).forEach(function (t) {
        if (parts.some(function (other) {return other !== p && other.node.add.indexOf(t) >= 0;})) diagnostics.push(p.spawn + ': excludes selected tag ' + t);
      });
    });
    // A required count alone is insufficient: the game also needs an eligible
    // candidate. Check declared slots, including essential body/barrel parts.
    var familyRoot = Object.keys(data.families || {}).find(function (name) {return data.families[name] === Number(rootId);}) || compositions[0].node.root;
    var rootChain = [], seenRoots = {};
    for (var root = familyRoot; root && !seenRoots[root]; root = data.roots[root] && data.roots[root].parent) {
      rootChain.push(root); seenRoots[root] = true;
    }
    var slotOrder = [];
    rootChain.some(function (name) {
      if (!(data.roots[name].slots || []).length) return false;
      slotOrder = data.roots[name].slots.map(function (slot) {return slot.toLowerCase();});
      return true;
    });
    function candidatePool(slot) {
      var cache = poolCache.get(data);
      if (!cache) {cache = {}; poolCache.set(data,cache);}
      var cacheKey = familyRoot + ':' + slot;
      if (!cache[cacheKey]) {
        var available = {};
        rootChain.slice().reverse().forEach(function (name) {
          Object.keys(data.nodes).forEach(function (spawn) {
            var node = data.nodes[spawn];
            if (node.root === name && node.slot === slot) available[node.name] = {spawn:spawn,node:node};
          });
          var references = data.partRefs && data.partRefs[name] && data.partRefs[name][slot] || [];
          references.forEach(function (spawn) {
            if (data.nodes[spawn]) available[data.nodes[spawn].name] = {spawn:spawn,node:data.nodes[spawn]};
          });
        });
        cache[cacheKey] = Object.keys(available).map(function (key) {return available[key];});
      }
      return cache[cacheKey];
    }
    function tagProducers() {
      var cache = poolCache.get(data);
      if (!cache) {cache = {}; poolCache.set(data,cache);}
      var key = 'tag-producers:' + familyRoot;
      if (!cache[key]) {
        var producers = {};
        slotOrder.forEach(function (slot) {
          candidatePool(slot).forEach(function (part) {
            var tags = part.node.applyAddTagsToCriteria === false ? part.node.criteriaTags || [] : part.node.add || [];
            tags.forEach(function (tag) {
              var slots = producers[tag] || (producers[tag] = []);
              if (slots.indexOf(slot) < 0) slots.push(slot);
            });
          });
        });
        cache[key] = producers;
      }
      return cache[key];
    }
    function ignoresMinStage(rule, part) {
      return (rule.ignoreMinStageParts || []).some(function (name) {return name === part.spawn || name === part.node.name;});
    }
    // A known name from a foreign namespace must not bypass the numeric
    // family's restrictions. Shared definitions are compared with their full
    // source fingerprints so copied firmware remains compatible.
    parts.forEach(function (part) {
      if (rootChain.indexOf(part.node.root) >= 0) return;
      var rule = rules[part.node.slot];
      var explicitlyReferenced = rule && (rule.parts || []).indexOf(part.spawn) >= 0;
      var equivalent = candidatePool(part.node.slot).find(function (candidate) {
        return candidate.spawn === part.spawn || (part.node.slot === 'firmware' && part.node.definitionHash && candidate.node.definitionHash === part.node.definitionHash);
      });
      if (explicitlyReferenced || equivalent) {
        familyChecks.push({part:part.spawn,item_family:familyRoot,compatible:true,
          basis:explicitlyReferenced ? 'explicit qualified composition reference' : equivalent.spawn === part.spawn ? 'explicit family part reference' : 'identical full exported definition',
          equivalent_part:equivalent ? equivalent.spawn : null,definition_sha256:part.node.definitionHash || null});
        return;
      }
      if (!part.node.definitionHash) {
        missing.push('No complete family compatibility definition for ' + part.spawn);
        return;
      }
      var slotLabel = part.node.slot.replace(/_/g,' ').replace(/\bacc\b/g,'accessory');
      failures.push('Wrong ' + slotLabel + ' part: this part belongs to a different item family (' + part.spawn + ').');
      familyChecks.push({part:part.spawn,item_family:familyRoot,compatible:false,
        basis:'Outside the family inheritance chain; no explicit reference or identical family definition',
        definition_sha256:part.node.definitionHash});
    });
    function knownValue(expression, fallback) {
      if (expression == null) return fallback;
      function tableValue(table, row, column) {
        var values;
        if (/^gbx_ue_data_table'lootschedule'$/i.test(table || '') && (!column || /^none$/i.test(column) || /^mingamestage/i.test(column))) values = window.LEGIT_LOOT_SCHEDULE;
        else if (/^gbx_ue_data_table'weapon_part_weight_table'$/i.test(table || '') && (!column || /^none$/i.test(column))) values = window.LEGIT_WEAPON_PART_WEIGHTS;
        if (!values) return null;
        var key = Object.keys(values).find(function (name) {return name.toLowerCase() === String(row).toLowerCase();});
        return key && Number.isFinite(Number(values[key])) ? Number(values[key]) : null;
      }
      var result;
      if (expression.attribute && !/attribute'none'$/i.test(expression.attribute)) {
        var attributeName = /^attribute'([^']+)'$/i.exec(expression.attribute);
        var attribute = attributeName && data.scalarAttributes && data.scalarAttributes[attributeName[1].toLowerCase()];
        if (!attribute) return null;
        result = attribute.constant == null ? tableValue(attribute.table,attribute.row,attribute.column) : attribute.constant;
        if (result == null || !Number.isFinite(attribute.scale)) return null;
        result *= attribute.scale;
      } else if (expression.datatablevalue && expression.datatablevalue.datatable && !/gbx_ue_data_table'none'$/i.test(expression.datatablevalue.datatable)) {
        result = tableValue(expression.datatablevalue.datatable,expression.datatablevalue.rowname,expression.datatablevalue.columnname);
      } else result = expression.constant == null ? null : Number(expression.constant);
      var scale = expression.postscale == null ? 1 : Number(expression.postscale);
      return result != null && Number.isFinite(result) && Number.isFinite(scale) ? result * scale : null;
    }
    if (data.selectionDefaults) slotOrder.forEach(function (slot) {
      var isRepkit = rootChain.indexOf('repair_kit') >= 0;
      var isMaliwan = /^mal_/.test(familyRoot);
      var auditedCompatibility = slot === 'magazine_acc' || ((slot === 'body_ele' || slot === 'secondary_ele') && isMaliwan) || (slot === 'element' && isRepkit);
      var rule = rules[slot] || data.selectionDefaults.partCount;
      var selected = bySlot[slot] || [];
      // The native fallback has a maximum as well as a minimum. Enforce it
      // for every declared slot, not just the conditional element/accessory slots.
      if (!rules[slot] && selected.length > Number(rule.max)) failures.push(slot + ': ' + selected.length + ' parts; game maximum is ' + rule.max + ' (' + selected.map(function (part) {return part.spawn;}).join(', ') + ').');
      var algorithm = data.selectionDefaults.evidence && data.selectionDefaults.evidence.algorithm;
      var targetPosition = slotOrder.indexOf(slot);
      if (targetPosition < 0) return;
      var criteria = new Set(inheritedTags);
      var upstreamParts = [];
      parts.forEach(function (part) {
        var position = slotOrder.indexOf(part.node.slot.toLowerCase());
        if (position < 0 || position >= targetPosition) return;
        upstreamParts.push(part);
        var tags = part.node.applyAddTagsToCriteria === false ? part.node.criteriaTags || [] : part.node.add || [];
        tags.forEach(function (tag) {criteria.add(tag);});
      });
      if (selected.length) {
        var audited = auditedCompatibility && !(slot === 'magazine_acc' && !criteria.has('tor_mag'));
        var nativeTags = algorithm && algorithm.interpretation.dependencies_require_all_tags && algorithm.interpretation.exclusions_reject_any_matching_tag;
        if (audited || nativeTags) {
          var upstreamCriteria = new Set(criteria);
          rootChain.forEach(function (name) {(data.roots[name].tags || []).forEach(function (tag) {upstreamCriteria.add(tag);});});
          var producers = nativeTags ? tagProducers() : {};
          selected.forEach(function (part) {
            var missingTags = (part.node.deps || []).filter(function (tag) {
              if (upstreamCriteria.has(tag)) return false;
              if (audited) return true;
              // Prove an absent structural prerequisite only when its sole
              // producer slot is earlier and an actual part occupies that slot.
              // Same-slot tiers and unknown external criteria stay separate.
              var slots = producers[tag] || [];
              return slots.length === 1 && slotOrder.indexOf(slots[0]) < targetPosition && upstreamParts.some(function (earlier) {return earlier.node.slot === slots[0];});
            });
            var excludedTags = (part.node.excludes || []).filter(function (tag) {return upstreamCriteria.has(tag);});
            if (!missingTags.length && !excludedTags.length) return;
            if (audited) failures.push(slot + ': incompatible selected part ' + part.spawn +
              (missingTags.length ? '; missing prerequisite ' + missingTags.join(', ') : '') +
              (excludedTags.length ? '; conflicts with ' + excludedTags.join(', ') : '') + '.');
            else failures.push('Incompatible ' + slot.replace(/_/g,' ').replace(/\bacc\b/g,'accessory') + ': this part does not match the selected parts.');
            compatibilityChecks.push({part:part.spawn,slot:slot,missing_prerequisites:missingTags,excluded_tags:excludedTags,
              upstream_parts:upstreamParts.map(function (earlier) {return earlier.spawn;}),criteria:Array.from(upstreamCriteria),
              dependency_producers:Object.fromEntries(missingTags.map(function (tag) {return [tag,producers[tag] || []];})),
              basis:audited ? 'Previously audited conditional selection criteria' : 'Native tag filters; contradictions use earlier slots, structural dependencies require a unique earlier producer slot'});
          });
        }
      }
      if (Number(rule.min) < 1 || selected.length >= Number(rule.min)) return;
      // Repeated selections in one slot can enable the next choice (class-mod
      // skill tiers are the main example). Existing points contribute criteria.
      function applyCriteria(part) {
        var tags = part.node.applyAddTagsToCriteria === false ? part.node.criteriaTags || [] : part.node.add || [];
        tags.forEach(function (tag) {criteria.add(tag);});
      }
      selected.forEach(applyCriteria);
      var criteriaAtDeficit = Array.from(criteria);
      var tagLimits = [];
      chain.forEach(function (name) {
        (data.nodes[name].tagRules || []).forEach(function (limit) {
          var tags = [];
          (limit.tags || []).forEach(function (set) {Object.keys(set).forEach(function (tag) {tags.push(tag.toLowerCase());});});
          var cap = tags.length === 1 && Number.isFinite(Number(limit.max)) && !(limit.gamestagerules || []).length ? Number(limit.max) : null;
          tags.forEach(function (tag) {tagLimits.push({tag:tag,max:cap,count:0});});
        });
      });
      parts.forEach(function (part) {
        var position = slotOrder.indexOf(part.node.slot.toLowerCase());
        if (position < 0 || position > targetPosition) return;
        var tags = part.node.applyAddTagsToCriteria === false ? part.node.criteriaTags || [] : part.node.add || [];
        tagLimits.forEach(function (limit) {if (tags.indexOf(limit.tag) >= 0) limit.count++;});
      });
      var candidates = candidatePool(slot).filter(function (part) {
        if (selected.some(function (existing) {return existing.node.name === part.node.name;})) return false;
        // Unknown tag-limit conditions cannot establish a candidate as available.
        if (tagLimits.some(function (limit) {return limit.max == null && (part.node.add || []).indexOf(limit.tag) >= 0;})) return false;
        if (rule.parts && rule.parts.length && !rule.parts.some(function (allowed) {return allowed.indexOf('.') >= 0 ? allowed === part.spawn : allowed === part.node.name;})) return false;
        var minStage = knownValue(part.node.minStage,0), weight = knownValue(part.node.weight,1);
        return (ignoresMinStage(rule,part) || (minStage != null && Number(decoded.level) >= minStage)) && weight != null && weight > 0;
      });
      // Below the target, one eligible next choice disproves exhaustion. The
      // whole minimum need not be reachable (some real rules request more
      // distinct parts than their allowlist contains).
      function constrained(part) {return tagLimits.some(function (limit) {return (part.node.add || []).indexOf(limit.tag) >= 0;}) ? 1 : 0;}
      var feasible = [];
      var pending = candidates.slice().sort(function (a,b) {return constrained(a) - constrained(b);});
      if (selected.length < Number(rule.min)) {
        var next = pending.findIndex(function (part) {
          if (!(part.node.deps || []).every(function (tag) {return criteria.has(tag);})) return false;
          if ((part.node.excludes || []).some(function (tag) {return criteria.has(tag);})) return false;
          return !tagLimits.some(function (limit) {return (part.node.add || []).indexOf(limit.tag) >= 0 && (limit.max == null || limit.count >= limit.max);});
        });
        if (next >= 0) feasible.push(pending[next]);
      }
      if (!feasible.length) return;
      var readableSlot = slot.replace(/_/g,' ').replace(/\bacc\b/g,'accessory').replace(/\bele\b/g,'element');
      var label = slot === 'magazine_acc' && criteria.has('tor_mag') ? 'Missing Torgue magazine accessory: impact or sticky is required with this magazine.' :
        slot === 'secondary_ele' && isMaliwan ? 'Missing secondary element: this Maliwan weapon requires a second element.' :
        slot === 'body_ele' && isMaliwan ? 'Missing primary element: this Maliwan weapon requires an element.' :
        slot === 'element' && isRepkit ? 'Missing RepKit element: this rarity requires an element part.' :
        'Missing required ' + readableSlot + ': this item must include this part.';
      if (selected.length) label = 'Missing required ' + readableSlot + ': another compatible part must be selected for this roll.';
      diagnostics = diagnostics.filter(function (message) {return !(message.indexOf(slot + ':') === 0 && message.indexOf('selection minimum') >= 0);});
      failures.push(label);
      selectionChecks.push({slot:slot, selected_count:selected.length, minimum:Number(rule.min),
        rule_source:ruleOrigins[slot] || 'native missing-rule fallback',
        criteria:criteriaAtDeficit,
        candidate_sequence:feasible.map(function (part) {return {part:part.spawn,
          min_stage:knownValue(part.node.minStage,0), min_stage_ignored:ignoresMinStage(rule,part), weight:knownValue(part.node.weight,1),
          dependencies:part.node.deps || [], exclusions:part.node.excludes || [],
          criteria_tags:part.node.applyAddTagsToCriteria === false ? part.node.criteriaTags || [] : part.node.add || []};}),
        tag_limits:tagLimits.map(function (limit) {return {tag:limit.tag,max:limit.max};}),
        proof_kind:'Eligible next selection below the native target; candidate exhaustion has not occurred',
        basis:'Extracted candidate eligibility plus native count-selection control flow; no per-serial native execution.'});
      evidence.push('Required ' + slot + ': minimum ' + rule.min + '; eligible parts: ' + feasible.map(function (part) {return part.spawn;}).join(', ') + '. Native count default: ' + data.selectionDefaults.evidence.constructor + '.');
    });
    // Written token order is a separate question from whether the part set can roll.
    // Slot order comes from the inherited part-type list. Rarity is written first.
    // Inside one slot, a part stays in its written place unless a later part in that
    // slot supplies one of its dependency tags. Numeric indexes are not an order,
    // and a packed {root:[a b]} block keeps the written sequence rather than sorting it.
    // One-way exclusions are not used to reorder parts or to ban the finished set.
    var orderIssues = [];
    if (!missing.length && slotOrder.length) {
      function slotRank(slot) {
        if (slot === 'inv_comp') return -1;
        var index = slotOrder.indexOf(String(slot || '').toLowerCase());
        return index < 0 ? null : index;
      }
      var known = [];
      parts.forEach(function (part, index) {
        var rank = slotRank(part.node.slot);
        if (rank != null) known.push({part:part, index:index, rank:rank});
      });
      var groups = {};
      known.forEach(function (row) {
        (groups[row.rank] || (groups[row.rank] = [])).push(row);
      });
      var expected = [];
      Object.keys(groups).map(Number).sort(function (a, b) {return a - b;}).forEach(function (rank) {
        var group = groups[rank];
        var used = {};
        for (var step = 0; step < group.length; step++) {
          var chosen = -1;
          for (var j = 0; j < group.length; j++) {
            if (used[j]) continue;
            var blocked = group.some(function (other, otherIndex) {
              return !used[otherIndex] && otherIndex !== j && (group[j].part.node.deps || []).some(function (tag) {
                return (other.part.node.add || []).indexOf(tag) >= 0;
              });
            });
            if (!blocked && (chosen < 0 || group[j].index < group[chosen].index)) chosen = j;
          }
          if (chosen < 0) {
            group.forEach(function (row, index) { if (!used[index]) expected.push(row); });
            break;
          }
          used[chosen] = true;
          expected.push(group[chosen]);
        }
      });
      var observedKeys = known.map(function (row) {return row.part.key;}).join(' ');
      var expectedKeys = expected.map(function (row) {return row.part.key;}).join(' ');
      if (known.length > 1 && observedKeys !== expectedKeys) {
        function describe(rows) {
          return rows.map(function (row) {
            var slot = row.part.node.slot === 'inv_comp' ? 'rarity' : row.part.node.slot;
            return slot.replace(/_/g, ' ') + ' ' + row.part.key;
          }).join(' → ');
        }
        orderIssues.push('Part order mismatch: written ' + describe(known) + '; expected ' + describe(expected) + '.');
      }
    }
    return {failures:failures, missing:missing, evidence:evidence, diagnostics:diagnostics, selectionChecks:selectionChecks, familyChecks:familyChecks, compatibilityChecks:compatibilityChecks,
      orderIssues:orderIssues,
      firmwareParts:firmware.map(function (p) { return p.spawn; }),
      npcOnly:inheritedTags.indexOf('npc_weapon') >= 0};
  }
  window.ExactRollValidation = {check:check};
})();
