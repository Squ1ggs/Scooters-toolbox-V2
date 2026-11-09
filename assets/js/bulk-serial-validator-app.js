/**
 * Bulk serial validator UI — decodes via cc-stx-decoder-bridge, validates via LegitDecodeHelpers (same window as legit-builder-core.js).
 */
(function () {
  'use strict';

  var BATCH = 32;
  var PAGE = 40;

  var state = {
    rows: [],
    page: 0,
    filter: 'all',
    running: false,
    /** Input lines with identical serial text merged when deduping (0 if none or if Keep duplicate lines). */
    inputDupMerged: 0,
    inputPreserveDups: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlightBarrelTokens(text) {
    text = String(text == null ? '' : text);
    /* Highlight Nexus tag tokens we care about when reasoning about barrel incompatibilities. */
    var re = /(barrel_[a-z0-9_]+)/gi;
    var out = [];
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      var start = m.index;
      var end = start + m[0].length;
      out.push(escapeHtml(text.slice(last, start)));
      out.push('<span class="bv-badtoken">' + escapeHtml(text.slice(start, end)) + '</span>');
      last = end;
    }
    out.push(escapeHtml(text.slice(last)));
    return out.join('');
  }

  function highlightReasonPhrases(htmlText) {
    htmlText = String(htmlText == null ? '' : htmlText);
    /* htmlText is already-escaped/annotated HTML from highlightBarrelTokens. Keep this simple. */
    return htmlText
      .replace(/\b(Exclusion:)/g, '<span class="bv-reason-bad">$1</span>')
      .replace(/\b(Compatibility:)/g, '<span class="bv-reason-bad">$1</span>')
      .replace(/\b(Inv tags(?:\\(global\\))?:)/g, '<span class="bv-reason-bad">$1</span>')
      .replace(/\b(Fail \\(data\\))/g, '<span class="bv-reason-bad">$1</span>');
  }

  function shortSerial(s, n) {
    s = String(s || '');
    if (s.length <= (n || 28)) return s;
    return s.slice(0, 14) + '…' + s.slice(-10);
  }

  /** Short hint for status line: confirms inv tag bundle is present for composition checks. */
  function invTagBundleStatusSuffix() {
    var inv = window.INV_COMP_TAG_DATA;
    if (!inv) return ' · inv tags: data bundle missing';
    var n = inv.partsByName && typeof Object.keys === 'function' ? Object.keys(inv.partsByName).length : null;
    if (n != null && n > 0) return ' · inv comp tags: ' + n + ' parts indexed';
    var ed = window.INV_PART_SELECTION_DATA;
    if (ed && typeof Object.keys === 'function') return ' · inv tags: bundle present · part layout rules: ' + Object.keys(ed).length + ' keys';
    return ' · inv tags: bundle present';
  }

  /** Prefer human-readable failure lines; skip footer stats so Notes column is useful. */
  function notesFromLegitState(ls) {
    if (!ls || !ls.details || !ls.details.length) return '';
    var skip =
      /^(Parts:|Sources:|Stats by|Stats known|Missing stat examples|Level range:|Item level:|Passes our checks|Rules passed:|Spawn claim:)/;
    var lines = [];
    var i;
    var d;
    for (i = 0; i < ls.details.length; i++) {
      d = ls.details[i];
      if (!skip.test(d)) lines.push(d);
    }
    if (!lines.length) {
      for (i = 0; i < ls.details.length; i++) {
        d = ls.details[i];
        if (!/^Item level:/.test(d)) lines.push(d);
      }
    }
    var joined = lines.slice(0, 5).join(' · ');
    if (joined.length > 420) return joined.slice(0, 417) + '…';
    if (joined) return joined;
    if (ls.statusText) return ls.statusText;
    return (ls.details && ls.details[0]) ? String(ls.details[0]) : '';
  }

  /** Longer notes for CSV/JSON export (no UI width cap). */
  function notesFullFromLegitState(ls) {
    if (!ls || !ls.details || !ls.details.length) return ls && ls.statusText ? String(ls.statusText) : '';
    var skip =
      /^(Parts:|Sources:|Stats by|Stats known|Missing stat examples|Level range:|Item level:|Passes our checks|Rules passed:|Spawn claim:)/;
    var lines = [];
    var i;
    var d;
    for (i = 0; i < ls.details.length; i++) {
      d = ls.details[i];
      if (!skip.test(d)) lines.push(d);
    }
    if (!lines.length) {
      for (i = 0; i < ls.details.length; i++) {
        d = ls.details[i];
        if (!/^Item level:/.test(d)) lines.push(d);
      }
    }
    return lines.slice(0, 25).join(' | ');
  }

  function partialRuleFailure(row) {
    var v=row.validation, ls=v && v.legitState;
    return !!(v && v.phase==='partial_exact' && ls && ls.status==='err' && ls.exactRollEvidence && ls.exactRollEvidence.partial_read && ls.exactRollEvidence.failures.length && v.partialDecodeEvidence && v.partialDecodeEvidence.header_verified && v.partialDecodeEvidence.complete===false);
  }

  function displayDecode(row) {
    if (!partialRuleFailure(row)) return row.rawDecode || {};
    var prefix=row.validation.partialDecodeEvidence;
    return {itemTypeId:prefix.itemTypeId,level:prefix.level,deserialized:prefix.deserialized_prefix,resolvedParts:[]};
  }

  function rowItemLabel(row) {
    var decoded = row.rawDecode || {};
    var parts = decoded.resolvedParts || [];
    function readable(name) {
      name = String(name || '').trim().replace(/^(?:legendary|pearlescent|epic|rare|uncommon|common)\s*[-–:]\s*/i, '');
      if (!name || /^(?:common|uncommon|rare|epic|legendary|pearlescent)$/i.test(name)) return '';
      if (/^(?:part_|comp_|base_comp_|leg_body_|body_\d|barrel \d|comp )/i.test(name) || /(?:augment \(id|placeholder)/i.test(name)) return '';
      return name;
    }
    var base = readable(decoded.baseName);
    if (base) return base;
    var namedRarity = parts.find(function (p) { return /rarity/i.test(p.part_type || '') && /^(?:legendary|pearlescent|epic|rare|uncommon|common)\s*[-–:]/i.test(p.name || ''); });
    if (namedRarity && readable(namedRarity.name)) return readable(namedRarity.name);
    var body = parts.find(function (p) { return /^(?:body|name\+skin)/i.test(p.part_type || '') && readable(p.name); });
    if (body) return readable(body.name);
    var npc = row.validation && row.validation.legitState && row.validation.legitState.nonObtainable;
    // Nexus inv_name_part np_fl4k_weapon names this composition Fanged Beast.
    if (npc && parts.some(function (p) { return /comp_fl4k_weapon/i.test(p.alpha_code || ''); })) return 'Fanged Beast';
    var cores = [];
    parts.forEach(function (p) {
      var name = readable(p.name);
      if (/^core$/i.test(p.part_type || '') && name && cores.indexOf(name) < 0) cores.push(name);
    });
    if (cores.length) return cores.join(' + ');
    var payload = parts.find(function (p) { return /^payload$/i.test(p.part_type || '') && readable(p.name); });
    if (payload) return readable(payload.name).replace(/\s+payload$/i, '') + ' grenade';
    return rowItemFamily(row) || (partialRuleFailure(row) ? 'Partially read item' : '');
  }

  function rowItemFamily(row) {
    var item = row.validation && row.validation.manifestItem;
    return String(item && (item.name || item.slug) || '');
  }

  function rowItemMeta(row) {
    var decoded = displayDecode(row);
    var rarity = decoded.rarity || '';
    if (!rarity) {
      var part = (decoded.resolvedParts || []).find(function (p) { return /^rarity$/i.test(p.part_type || ''); });
      var tier = part && String(part.name || '').match(/^(Common|Uncommon|Rare|Epic|Legendary|Pearlescent)\b/i);
      if (tier) rarity = tier[1];
    }
    return [decoded.level != null ? 'Lv ' + decoded.level : '', rarity, rowItemFamily(row)].filter(Boolean).join(' · ');
  }

  function rowStatsLine(row) {
    var ls = row.validation && row.validation.legitState;
    if (!ls) return '';
    return (
      'idRaw ' +
      (ls.statsIdRawFound != null ? ls.statsIdRawFound : '?') +
      '/' +
      (ls.partCount != null ? ls.partCount : '?') +
      ' · stats ' +
      (ls.statsAnyFound != null ? ls.statsAnyFound : '?') +
      '/' +
      (ls.partCount != null ? ls.partCount : '?')
    );
  }

  /** Buckets `legitState.details` lines for JSON `flagging.detail_line_categories`. */
  function categorizeLegitDetailLine(line) {
    var s = String(line || '');
    if (/^\[critical\]/i.test(s) || /wrong root/i.test(s) || (/Duplicate part/i.test(s) && /only 1 allowed/i.test(s))) {
      return 'critical_rules';
    }
    if (/Part order mismatch/i.test(s) || /^\[order\]/i.test(s)) return 'part_order';
    if (/^\[composition\]/i.test(s)) return 'composition';
    if (/^\[slot-map\]/i.test(s)) return 'slot_map';
    if (/^\[raw\]/i.test(s)) return 'raw_composition';
    if (/^Exclusion:/i.test(s)) return 'exclusion';
    if (/^Comp allowlist:/i.test(s)) return 'comp_allowlist';
    if (/^Compatibility:/i.test(s)) return 'compatibility';
    if (/^Inv tags/i.test(s)) return 'inv_tags';
    if (/missing dependency tag/i.test(s)) return 'dependency';
    if (
      /^(Parts:|Sources:|Stats by|Stats known|Missing stat examples|Level range:|Item level:|Passes our checks|Rules passed:|Spawn claim:|Bulk natural|Natural legitimacy)/i.test(
        s
      )
    ) {
      return 'diagnostics';
    }
    if (/weight|schedule|spawn|off_pool/i.test(s)) return 'loot_meta';
    if (/NCS|slot order|wrong slot/i.test(s)) return 'ncs';
    if (/Balance Fail/i.test(s)) return 'balance_fail';
    return 'other';
  }

  function countDetailCategories(details) {
    var counts = Object.create(null);
    var arr = details || [];
    var i;
    for (i = 0; i < arr.length; i++) {
      var cat = categorizeLegitDetailLine(arr[i]);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }

  function firstActionableDetailLine(details) {
    var i;
    var d;
    for (i = 0; i < (details || []).length; i++) {
      d = String(details[i] || '');
      if (
        /^(Exclusion:|Compatibility:|Inv tags|\[composition\]|\[raw\]|\[critical\]|\[slot-map\]|Part order mismatch)/i.test(
          d
        )
      ) {
        return d;
      }
    }
    return details && details[0] != null ? String(details[0]) : '';
  }

  function compactDecodeForExport(dr) {
    if (!dr || typeof dr !== 'object') return null;
    var rp = dr.resolvedParts;
    var rpc = Array.isArray(rp) ? rp.length : 0;
    var unr = 0;
    var i;
    if (Array.isArray(rp)) {
      for (i = 0; i < rp.length; i++) {
        if (rp[i] && rp[i].unresolved) unr++;
      }
    }
    return {
      success: !!dr.success,
      error: dr.success ? '' : String(dr.error || ''),
      manufacturer: dr.manufacturer != null ? dr.manufacturer : null,
      item_type: dr.itemType != null ? dr.itemType : null,
      item_type_id: dr.itemTypeId != null ? dr.itemTypeId : dr.item_type_id != null ? dr.item_type_id : null,
      level: dr.level != null ? dr.level : null,
      resolved_parts_count: rpc,
      unresolved_parts_count: unr
    };
  }

  function validationContextForExport(v) {
    if (!v || typeof v !== 'object') return null;
    return {
      phase: v.phase != null ? String(v.phase) : null,
      ok: v.ok === true,
      error: v.error != null ? String(v.error) : null,
      mapped: v.mapped !== false,
      mapped_count: v.mappedCount != null ? v.mappedCount : null,
      resolved_row_count: v.resolvedRowCount != null ? v.resolvedRowCount : null,
      unresolved_decode_parts: v.unresolved != null ? v.unresolved : null,
      manifest_manufacturer: v.manufacturer != null ? v.manufacturer : null,
      manifest_item_type: v.itemType != null ? v.itemType : null,
      item_level_used: v.itemLevel != null ? v.itemLevel : null
    };
  }

  /**
   * Rich failure context for JSON export (omitted when bucket is ok).
   * Includes every `legitState.details` string (UI `notes` / CSV `notes_full` still filter some lines).
   */
  function buildFlaggingExport(row, bucket) {
    var v = row.validation;
    var ls = v && v.legitState;
    var dr = row.rawDecode;
    var details = ls && Array.isArray(ls.details) ? ls.details.map(function (x) { return String(x); }) : [];
    var out = {
      bucket: bucket,
      legit_status_code: ls && ls.status ? String(ls.status) : null,
      legit_status_text: ls && ls.statusText ? String(ls.statusText) : null,
      verdict: ls && ls.verdict ? String(ls.verdict) : null,
      verdict_reason: ls && ls.verdictReason ? String(ls.verdictReason) : null,
      firmware_flag: ls && ls.firmwareFlag && ls.firmwareFlag.text ? String(ls.firmwareFlag.text) : null,
      detail_line_categories: countDetailCategories(details),
      legit_details_all: details,
      validation: validationContextForExport(v),
      decode: compactDecodeForExport(dr)
    };
    if (!row.decodeOk && !partialRuleFailure(row)) {
      out.decode_failed = true;
      out.primary_reason = row.decodeError ? String(row.decodeError) : 'decode_failed';
      return out;
    }
    if (bucket === 'nomanifest') {
      out.primary_reason = v && v.error ? String(v.error) : 'no_manifest';
      out.manifest_hint = {
        manufacturer: v && v.manufacturer != null ? v.manufacturer : null,
        item_type: v && v.itemType != null ? v.itemType : null
      };
      return out;
    }
    if (bucket === 'nomap') {
      out.primary_reason = firstActionableDetailLine(details) || (ls && ls.statusText ? String(ls.statusText) : 'unmapped_slot_map');
      if (!details.length) {
        out.slot_map_note =
          'Decoded OK but no manifest parts matched NCS slots (layout map gap or pool drift). See decode counts in flagging.decode.';
      }
      return out;
    }
    out.primary_reason =
      firstActionableDetailLine(details) ||
      (ls && ls.statusText ? String(ls.statusText) : '') ||
      bucket;
    return out;
  }

  function flattenRowForExport(row) {
    var c = classifyRow(row);
    var ls = row.validation && row.validation.legitState;
    var legitLabel = '—';
    var notes = '';
    var notesFull = '';
    var stCode = '';
    var spawnVerdict = '';
    var spawnReason = '';
    var firmwareFlag = '';
    if (ls) {
      legitLabel = ls.statusText || ls.status || '—';
      spawnVerdict = ls.verdict || (ls.status === 'ok' ? 'Can roll' : ls.status === 'err' ? 'Cannot roll' : 'Not sure');
      spawnReason = ls.verdictReason || '';
      firmwareFlag = ls.firmwareFlag && ls.firmwareFlag.text ? String(ls.firmwareFlag.text) : '';
      stCode = ls.status || '';
      notes = notesFromLegitState(ls);
      notesFull = notesFullFromLegitState(ls);
    } else if (!row.decodeOk) {
      spawnVerdict = 'Cannot roll';
      spawnReason = row.decodeError ? String(row.decodeError) : 'Could not decode this serial.';
    } else if (row.validation && row.validation.mapped === false) {
      legitLabel = 'Uncertain (no slot map)';
      spawnVerdict = 'Not sure';
      spawnReason = 'Decoded, but a part did not map and there is no hard rule.';
      notes = 'Decode OK; no manifest parts matched NCS slots';
    } else if (row.validation && row.validation.phase === 'manifest') {
      legitLabel = 'No manifest';
      spawnVerdict = 'Not sure';
      spawnReason = 'Item type is not in our tables.';
      notes = String(row.validation.manufacturer || '') + ' / ' + String(row.validation.itemType || '');
    }
    var offPool = ls && Array.isArray(ls.offPoolParts) ? ls.offPoolParts : [];
    var offPoolSummary = '';
    if (offPool.length) {
      offPoolSummary = offPool
        .map(function (x) {
          return x.display || '';
        })
        .filter(Boolean)
        .join(' | ');
    }
    var align = computeAlignmentFlags(row);
    var answer = publicResult(row);
    spawnVerdict = answer.label;
    spawnReason = answer.reason;
    legitLabel = answer.label;
    var flat = {
      bucket: c,
      failure_category: c === 'order' ? 'order' : c === 'err' ? failureCategory(row) : null,
      exact_roll_evidence: ls && ls.exactRollEvidence || null,
      serial: row.serial,
      decode_ok: row.decodeOk,
      partial_read_rejection: partialRuleFailure(row),
      partial_decode_evidence: partialRuleFailure(row) ? row.validation.partialDecodeEvidence : null,
      decode_error: row.decodeError || '',
      item: rowItemLabel(row),
      item_family: rowItemFamily(row),
      item_description: rowItemMeta(row),
      legit_status: legitLabel,
      legit_status_code: stCode,
      verdict: spawnVerdict,
      verdict_reason: spawnReason,
      firmware_flag: firmwareFlag,
      notes: notes,
      notes_full: notesFull,
      off_pool_parts: offPool,
      off_pool_summary: offPoolSummary,
      stats: rowStatsLine(row),
      drop_hint: publicDropHint(row.dropText),
      drop_match_scope: row.decodeOk && row.dropText && row.dropText !== '—' && String(row.dropText).toLowerCase() !== 'modded' ? 'named_item' : 'none',
      exact_roll_drop_confirmed: null,
      manufacturer: row.rawDecode && row.rawDecode.manufacturer,
      item_type: row.rawDecode && row.rawDecode.itemType,
      align_strict_ok_data: align.align_strict_ok_data,
      align_no_fail_data: align.align_no_fail_data,
      align_mapped_no_fail_data: align.align_mapped_no_fail_data,
      align_soft_ok_or_warn: align.align_soft_ok_or_warn
    };
    if (c !== 'ok') {
      flat.flagging = buildFlaggingExport(row, c);
    }
    return flat;
  }

  function getKpiSnapshot(rows) {
    var n = rows.length;
    var dec = 0;
    var ok = 0;
    var wrn = 0;
    var decodeFail = 0;
    var nomanifest = 0;
    var legitErr = 0;
    var order = 0;
    var i;
    var r;
    var c;
    for (i = 0; i < n; i++) {
      r = rows[i];
      if (r.decodeOk) dec++;
      c = classifyRow(r);
      if (c === 'ok') ok++;
      else if (c === 'order') order++;
      else if (c === 'decode') decodeFail++;
      else if (c === 'nomanifest') nomanifest++;
      else if (c === 'err') legitErr++;
      else wrn++;
    }
    var breakdown = {balance:0, order:0, prerequisite:0, non_obtainable:0};
    rows.forEach(function (row) { if (classifyRow(row) === 'err') breakdown[failureCategory(row)]++; });
    return {
      total: n,
      valid: ok,
      invalid: legitErr + decodeFail,
      needs_attention: n-ok,
      order_issues: order,
      rule_failures: legitErr-breakdown.non_obtainable,
      usually_unobtainable: breakdown.non_obtainable,
      not_checked: wrn + nomanifest,
      failure_breakdown: breakdown,
      decoded_ok: dec,
      full_decode_failed: rows.filter(function (row) {return !row.decodeOk;}).length,
      partial_read_rejections: rows.filter(partialRuleFailure).length,
      ok_data: ok,
      uncertain_or_map: wrn,
      decode_failed: decodeFail,
      no_manifest: nomanifest,
      fail_data: legitErr,
      input_dup_lines_merged: state.inputDupMerged || 0,
      preserve_duplicate_input_lines: !!state.inputPreserveDups
    };
  }

  /** Count by bucket + status label (for quick sharing). */
  function buildStatusHistogram(rows) {
    var hist = {};
    var i;
    var r;
    var c;
    var label;
    var key;
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      c = classifyRow(r);
      label = '';
      if (r.validation && r.validation.legitState) {
        label = r.validation.legitState.statusText || r.validation.legitState.status || '';
      } else if (r.validation && r.validation.mapped === false) label = 'uncertain_no_slot_map';
      else if (r.validation && r.validation.phase === 'manifest') label = 'no_manifest';
      else if (!r.decodeOk) label = String(r.decodeError || 'decode_fail').slice(0, 120);
      key = c + '|' + label;
      hist[key] = (hist[key] || 0) + 1;
    }
    var entries = Object.keys(hist).map(function (k) {
      return { key: k, count: hist[k] };
    });
    entries.sort(function (a, b) {
      return b.count - a.count;
    });
    return entries.slice(0, 80);
  }

  function collectRowsForExport() {
    var rows = state.rows;
    var el = $('bv-export-filtered');
    if (el && el.checked) return rows.filter(rowMatchesFilter);
    return rows.slice();
  }

  /** Rows that passed composition (OK / legit). */
  function collectLegitPassRows() {
    return state.rows.filter(function (r) {
      return classifyRow(r) === 'ok';
    });
  }

  /**
   * Non-pass rows for save filtering: Fail + Uncertain + decode/manifest issues.
   * Stricter than Fail-only — catches “slightly modded” / unmapped uncertain gear.
   */
  function collectNonOkModdedRows() {
    return state.rows.filter(function (r) {
      return classifyRow(r) !== 'ok';
    });
  }

  /** Composition hard-fails only (Fail data / decode / no manifest). */
  function collectFailDataRows() {
    return state.rows.filter(function (r) {
      var c = classifyRow(r);
      return c === 'err' && failureCategory(r) !== 'non_obtainable';
    });
  }

  function downloadBlob(filename, mime, text) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function stampExportName(prefix) {
    return prefix + '-' + new Date().toISOString().slice(0, 19).replace(/:/g, '') + '.txt';
  }

  /**
   * Plain serial list (one per line) for backpack / bulk-add paste.
   * @param {'legit'|'nonok'|'fail'|'ok_drop_modded'|'ok_pool'} kind
   */
  function exportSerialListTxt(kind) {
    var rows;
    var label;
    var fname;
    if (kind === 'legit') {
      rows = collectLegitPassRows();
      label = 'No modded parts found';
      fname = stampExportName('bulk-serials-ok-legit');
    } else if (kind === 'fail') {
      rows = collectFailDataRows();
      label = 'Modded';
      fname = stampExportName('bulk-serials-fail-only');
    } else if (kind === 'ok_drop_modded') {
      rows = state.rows.filter(function (r) {
        return classifyRow(r) === 'ok' && String(r.dropText || '').trim().toLowerCase() === 'modded';
      });
      label = 'Passed checks; source not listed';
      fname = stampExportName('bulk-serials-ok-drop-modded');
    } else if (kind === 'ok_pool') {
      rows = state.rows.filter(function (r) {
        return (
          classifyRow(r) === 'ok' && !!r.dropText && r.dropText !== '—' && String(r.dropText).trim().toLowerCase() !== 'modded'
        );
      });
      label = 'Passed checks; source listed';
      fname = stampExportName('bulk-serials-ok-pool-hint');
    } else {
      rows = collectNonOkModdedRows();
      label = 'Needs attention';
      fname = stampExportName('bulk-serials-needs-attention');
    }
    if (!state.rows.length) {
      statusLine('Nothing to export — run validation first.', 'warn');
      return;
    }
    if (!rows.length) {
      statusLine('No ' + label + ' rows in this run.', 'warn');
      return;
    }
    var lines = [];
    var i;
    var s;
    for (i = 0; i < rows.length; i++) {
      s = String(rows[i].serial || '').trim();
      if (s) lines.push(s);
    }
    downloadBlob(fname, 'text/plain;charset=utf-8', lines.join('\n') + (lines.length ? '\n' : ''));
    statusLine('Exported ' + lines.length + ' ' + label + ' serial(s) → ' + fname, 'ok');
  }

  function csvEscape(s) {
    s = String(s == null ? '' : s);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  /**
   * Fingerprint bundled validation data so exports prove which inv tag extract + API loaded.
   */
  function getValidationDataBundleMeta() {
    var out = {
      exact_roll_data: window.EXACT_ROLL_DATA ? {source:window.EXACT_ROLL_DATA.source, identities:Object.keys(window.EXACT_ROLL_DATA.ids).length, selection_defaults:window.EXACT_ROLL_DATA.selectionDefaults || null} : null,
      loot_schedule_evidence: window.LEGIT_LOOT_SCHEDULE_EVIDENCE || null,
      serial_identity_data: window.LEGIT_SERIAL_IDENTITY_DATA ? {
        source: window.LEGIT_SERIAL_IDENTITY_DATA.source,
        part_count: Object.keys(window.LEGIT_SERIAL_IDENTITY_DATA.parts).length
      } : null,
      legit_builder_api: !!(
        window.LegitBuilderApi && typeof window.LegitBuilderApi.computeLegitValidationState === 'function'
      ),
      inv_comp_tag_data: null
    };
    var inv = window.INV_COMP_TAG_DATA;
    if (inv && inv._meta) {
      var m = inv._meta;
      out.inv_comp_tag_data = {
        generated_at: m.generated_at || null,
        source_files: m.source_files || [],
        part_count: m.part_count != null ? m.part_count : null,
        comp_count: m.comp_count != null ? m.comp_count : null,
        stats: m.stats || null
      };
    } else if (inv) {
      out.inv_comp_tag_data = {
        generated_at: null,
        source_files: [],
        part_count: inv.partsByName ? Object.keys(inv.partsByName).length : null,
        comp_count: inv.compBasetags ? Object.keys(inv.compBasetags).length : null,
        stats: null,
        note: '_meta missing on INV_COMP_TAG_DATA'
      };
    }
    var ec = window.INVENTORY_ITEM_CATALOG;
    var ps = window.INV_PART_SELECTION_DATA;
    out.inventory_layout_reference = {
      loaded: !!(ec || ps),
      catalog_weapon_rows: ec && ec.weapons ? ec.weapons.length : null,
      part_selection_keys: ps ? Object.keys(ps).length : null,
      exclusion_tag_rows: window.INV_PART_EXCLUSION_TAGS ? Object.keys(window.INV_PART_EXCLUSION_TAGS).length : null,
      part_weight_rows: window.INV_PART_WEIGHTS ? Object.keys(window.INV_PART_WEIGHTS).length : null,
      min_max_slot_rows: window.INV_PART_MIN_MAX_SLOTS ? Object.keys(window.INV_PART_MIN_MAX_SLOTS).length : null
    };
    out.legit_decode_helpers_version =
      window.LegitDecodeHelpers && window.LegitDecodeHelpers.__version
        ? String(window.LegitDecodeHelpers.__version)
        : null;
    return out;
  }

  function exportJsonReport() {
    var rows = collectRowsForExport();
    if (!rows.length) {
      statusLine('Nothing to export — run validation first.', 'warn');
      return;
    }
    var il = parseInt(($('bv-level') && $('bv-level').value) || '60', 10);
    var filtered = $('bv-export-filtered') && $('bv-export-filtered').checked;
    var flat = rows.map(flattenRowForExport);
    var payload = {
      exported_at: new Date().toISOString(),
      tool: 'bulk-serial-validator',
      validation_data_bundle: getValidationDataBundleMeta(),
      row_schema_note:
        'Every row includes align_* booleans. If bucket is not ok, flagging holds primary_reason, full legit_details_all (every Legit Builder line, including Parts:/Stats: diagnostics omitted from notes_full), detail_line_categories counts, validation snapshot, and compact decode stats — use this to see exactly why a row failed.',
      partial_read_note: 'partial_read_rejection means the full decoder failed, but complete verified prefix tokens independently prove a contradiction. decode_ok remains false; partial_decode_evidence records scope and bit offsets. No partial read can pass, and no missing-part inference is made from an unparsed tail.',
      alignment_definitions: {
        align_strict_ok_data:
          'Same as KPI OK (data): LegitBuilderApi status OK with mapped slots (unmapped rows are Uncertain, not OK).',
        align_no_fail_data:
          'Decoded + manifest item resolved + not Fail (data).',
        align_mapped_no_fail_data:
          'Decoded + manifest + at least one mapped slot + not Fail (data). Excludes unmapped-only rows.',
        align_soft_ok_or_warn:
          'Mapped + legit state ok or warn (not err). Counts rows that are not hard-fail even if tag/source lines are warnings.',
        alignment_flags_note:
          'Bulk uses natural legitimacy: strict slot-map match, inv tags (incl. unique/licensed), weights/schedule. Soft uni_/leg_ dep gaps alone stay FYI. Unmapped → Fail or Uncertain.'
      },
      alignment_summary: buildAlignmentSummary(rows),
      options: {
        item_level: Number.isFinite(il) ? il : 60,
        validation_profile: 'bulk_cheat_audit',
        strict_mode: true,
        bulk_cheat_audit_mode: true,
        relax_inv_dependencytags: false,
        inv_tag_failures_as_err: true,
        detect_plain_frame_uni_leg: true,
        fail_off_pool_named_legendary_barrels: false,
        export_filtered_only: filtered,
        table_filter: state.filter
      },
      summary: getKpiSnapshot(rows),
      status_histogram: buildStatusHistogram(rows),
      rows: flat
    };
    var name = 'bulk-serial-validation-' + new Date().toISOString().slice(0, 19).replace(/:/g, '') + '.json';
    downloadBlob(name, 'application/json', JSON.stringify(payload, null, 2));
    statusLine('Exported ' + rows.length + ' rows to ' + name + (filtered ? ' (filtered)' : '') + '.', 'ok');
  }

  function exportCsv() {
    var rows = collectRowsForExport();
    if (!rows.length) {
      statusLine('Nothing to export — run validation first.', 'warn');
      return;
    }
    var headers = [
      'bucket',
      'serial',
      'decode_ok',
      'item',
      'legit_status',
      'verdict',
      'verdict_reason',
      'firmware_flag',
      'align_strict_ok_data',
      'align_no_fail_data',
      'align_mapped_no_fail_data',
      'align_soft_ok_or_warn',
      'stats',
      'drop_hint',
      'drop_match_scope',
      'exact_roll_drop_confirmed',
      'off_pool_summary',
      'notes_full'
    ];
    var lines = [headers.join(',')];
    var i;
    var r;
    var f;
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      f = flattenRowForExport(r);
      lines.push(
        [
          csvEscape(f.bucket),
          csvEscape(f.serial),
          csvEscape(f.decode_ok ? 'yes' : 'no'),
          csvEscape(f.item),
          csvEscape(f.legit_status),
          csvEscape(f.verdict || ''),
          csvEscape(f.verdict_reason || ''),
          csvEscape(f.firmware_flag || ''),
          csvEscape(f.align_strict_ok_data ? 'yes' : 'no'),
          csvEscape(f.align_no_fail_data ? 'yes' : 'no'),
          csvEscape(f.align_mapped_no_fail_data ? 'yes' : 'no'),
          csvEscape(f.align_soft_ok_or_warn ? 'yes' : 'no'),
          csvEscape(f.stats),
          csvEscape(f.drop_hint),
          csvEscape(f.drop_match_scope),
          csvEscape('not confirmed'),
          csvEscape(f.off_pool_summary || ''),
          csvEscape(f.notes_full)
        ].join(',')
      );
    }
    var name = 'bulk-serial-validation-' + new Date().toISOString().slice(0, 19).replace(/:/g, '') + '.csv';
    downloadBlob(name, 'text/csv;charset=utf-8', '\uFEFF' + lines.join('\r\n'));
    statusLine('Exported ' + rows.length + ' rows to ' + name + '.', 'ok');
  }

  function readableReportRows(rows) {
    return rows.map(function (row,index) {
      var result=flattenRowForExport(row),ls=row.validation && row.validation.legitState;
      result.report_index=state.rows.indexOf(row)+1 || index+1;
      result.readable_reason=readableReason(row);
      result.readable_parts=serializedPartRows(row);
      result.readable_failures=Array.from(new Set((ls && ls.exactRollEvidence && ls.exactRollEvidence.failures || []).map(readableRuleText)));
      return result;
    });
  }

  function exportReadableReport() {
    var rows=collectRowsForExport();
    if(!rows.length){statusLine('Run validation before downloading a report.','warn');return;}
    downloadBlob('item-validation-report-'+new Date().toISOString().slice(0,10)+'.html','text/html;charset=utf-8',window.ValidatorReadableReport.html(readableReportRows(rows)));
    statusLine('Downloaded readable report for '+rows.length+' items. Open it in your browser to search, filter or print.','ok');
  }

  function exportMarkdownSummary() {
    var rows=collectRowsForExport();
    if(!rows.length){statusLine('Run validation before downloading a summary.','warn');return;}
    downloadBlob('item-validation-summary-'+new Date().toISOString().slice(0,10)+'.md','text/markdown;charset=utf-8',window.ValidatorReadableReport.markdown(readableReportRows(rows)));
    statusLine('Downloaded readable text summary for '+rows.length+' items.','ok');
  }

  function statusLine(msg, kind) {
    var el = $('bv-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'bv-status' + (kind ? ' ' + kind : '');
  }

  function classifyRow(row) {
    var bulkPage = typeof window !== 'undefined' && window.STX_BULK_CHEAT_AUDIT === true;
    if (!row.decodeOk) return partialRuleFailure(row) ? 'err' : 'decode';
    if (!row.validation || row.validation.phase === 'manifest') return 'nomanifest';
    if (row.validation.mapped === false) {
      var lsU = row.validation.legitState;
      if (lsU && lsU.status === 'err') return 'err';
      /* Unmapped without Fail → Uncertain (no longer OK even if raw exclusion scan is clean). */
      return 'nomap';
    }
    var st = row.validation.legitState;
    if (!st) return 'idle';
    if (st.status === 'err') return 'err';
    if (st.status === 'order' || st.orderOnly) return 'order';
    if (st.status === 'ok') return 'ok';
    /* computeLegitValidationState can leave status 'idle' when a warn path was skipped (bulk); that was counted as uncertain — treat as OK on this page only. */
    // An unfinished validation is not a pass.
    return 'warn';
  }

  function publicResult(row) {
    var bucket = classifyRow(row);
    var ls = row.validation && row.validation.legitState;
    if (bucket === 'ok') return { label: 'No modded parts found', reason: 'Parts and level pass the game-rule checks.' };
    if (bucket === 'order') return { label: 'Order issue', reason: (ls && ls.verdictReason) || 'These parts are written in a different order than this item’s slot list. The same parts can still satisfy the other checks. This alone does not show the item was modded.' };
    if (bucket === 'err') return { label: partialRuleFailure(row) ? 'Modded — partial read' : ls && ls.nonObtainable ? 'Usually unobtainable' : 'Modded', reason: ls && ls.nonObtainable ? 'Marked as NPC-only in the game data. It may be spawned, but is not normally available as player loot.' : ((ls && ls.verdictReason) || 'This combination breaks the game rules.').replace(/^\[exact\]\s*/, '') };
    if (bucket === 'decode') return { label: 'Invalid serial', reason: 'Cannot read this code. Paste the complete serial again.' };
    if (bucket === 'nomanifest') return { label: 'Cannot check: unsupported item', reason: 'This item type is missing from our validation data.' };
    if (bucket === 'nomap') return { label: 'Cannot check: unknown parts', reason: 'The serial decodes, but its parts cannot be matched to the validation tables.' };
    return { label: 'Cannot verify this roll', reason: (ls && ls.verdictReason) || 'Validation did not finish. Run the check again.' };
  }

  function publicDropHint(text) {
    return String(text || '').trim().toLowerCase() === 'modded' ? 'Source not listed' : (text || '—');
  }

  function summaryText(total, passed, modded, manual, unreadable, usually, order) {
    if (!total) return 'Your results will appear here after you select Validate all.';
    usually=usually || 0;
    order=order || 0;
    var outcomes=[passed+' passed'];
    if(order)outcomes.push(order+' order issue'+(order===1?'':'s'));
    if(modded-usually)outcomes.push((modded-usually)+' rule failure'+(modded-usually===1?'':'s'));
    if(usually)outcomes.push(usually+' usually unobtainable');
    if(unreadable)outcomes.push(unreadable+' invalid serial'+(unreadable===1?'':'s'));
    if(manual)outcomes.push(manual+(manual===1?' needs':' need')+' verification');
    return total+' checked: '+outcomes.join(', ')+'.';
  }

  function failureCategory(row) {
    var ls = row.validation && row.validation.legitState;
    if (ls && ls.nonObtainable) return 'non_obtainable';
    var reason = ls && ls.verdictReason || '';
    if (/missing dependency|missing prerequisite/i.test(reason)) return 'prerequisite';
    if (/part order mismatch/i.test(reason)) return 'order';
    return 'balance';
  }

  function sourceHtml(row) {
    if (partialRuleFailure(row)) return '<span class="muted">Drop lookup is unavailable for a partial read.</span>';
    if (!row.decodeOk) return '<span class="muted">Read the code first</span>';
    var text = publicDropHint(row.dropText);
    if (text === '—' || text === 'Source not listed') {
      return 'No drop source listed<div class="bv-source-note">Our source data does not cover this item.</div>';
    }
    // This lookup matches the named item's composition, not every part in the serial.
    // Prefer player-facing enemy names; retain pool IDs in the expandable evidence.
    var named = text.match(/Drops from: ([^•]+)/);
    var headline = named ? 'Drops from: ' + named[1].trim() : text.split(' • ')[0];
    return escapeHtml(headline) + '<div class="bv-source-note">Source for this item. Exact part combination not confirmed.</div>' +
      (headline !== text ? '<details class="bv-more"><summary>Source details</summary>' + escapeHtml(text) + '</details>' : '');
  }

  function failureGroup(row) {
    var reason = publicResult(row).reason;
    if (/firmware/i.test(reason)) return 'Firmware that cannot roll on this item';
    if (/wrong root|wrong family|manufacturer/i.test(reason)) return 'Parts from the wrong item or manufacturer';
    if (/duplicate|only 1 allowed/i.test(reason)) return 'A part is repeated when only one is allowed';
    if (/level|MinGameStage/i.test(reason)) return 'An item or part is outside its allowed level';
    if (/exclusion|incompatible|compatibility|dependency|allowlist|tags/i.test(reason)) return 'Parts that cannot roll together';
    if (/count|maximum|exceeds|over.max|outside range/i.test(reason)) return 'Too many parts, or a required part is missing';
    return 'Other game-rule failures';
  }

  function renderFailureGroups() {
    var el = $('bv-failure-groups');
    if (!el) return;
    var groups = {};
    var failures = state.rows.filter(function (row) { return classifyRow(row) === 'err' && failureCategory(row) !== 'non_obtainable'; });
    failures.forEach(function (row) {
      var key = failureGroup(row);
      groups[key] = (groups[key] || 0) + 1;
    });
    el.hidden = !failures.length;
    el.innerHTML = '<summary>'+(failures.length === 1 ? 'Why did this item fail a rule?' : 'Why did these '+failures.length+' items fail a rule?')+'</summary>' +
      '<p class="small">Grouped by each item’s first failed rule. Open an item below for the exact parts and evidence.</p><ul>' +
      Object.keys(groups).sort(function (a, b) { return groups[b] - groups[a]; }).map(function (key) {
        return '<li><strong>' + groups[key] + '</strong> — ' + escapeHtml(key) + '</li>';
      }).join('') + '</ul>';
  }

  /**
   * Optional alignment counts for exports (same dataset, different row buckets).
   */
  function computeAlignmentFlags(row) {
    var c = classifyRow(row);
    var v = row.validation;
    var decodeOk = !!row.decodeOk;
    var hasManifest = !!(v && v.phase !== 'manifest');
    var mappedOk = v && v.mapped !== false;
    var ls = v && v.legitState;
    return {
      align_strict_ok_data: c === 'ok',
      align_no_fail_data: decodeOk && hasManifest && c !== 'err',
      align_mapped_no_fail_data: decodeOk && hasManifest && mappedOk && c !== 'err',
      align_soft_ok_or_warn:
        decodeOk && hasManifest && mappedOk && ls && (ls.status === 'ok' || ls.status === 'warn')
    };
  }

  function buildAlignmentSummary(rows) {
    var a = {
      align_strict_ok_data: 0,
      align_no_fail_data: 0,
      align_mapped_no_fail_data: 0,
      align_soft_ok_or_warn: 0
    };
    var i;
    var r;
    var f;
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      f = computeAlignmentFlags(r);
      if (f.align_strict_ok_data) a.align_strict_ok_data++;
      if (f.align_no_fail_data) a.align_no_fail_data++;
      if (f.align_mapped_no_fail_data) a.align_mapped_no_fail_data++;
      if (f.align_soft_ok_or_warn) a.align_soft_ok_or_warn++;
    }
    return a;
  }

  function rowMatchesFilter(row) {
    var f = state.filter;
    if (f === 'all') return true;
    var c = classifyRow(row);
    if (f === 'attention') return c !== 'ok';
    if (f === 'invalid') return c === 'err' || c === 'decode';
    if (f === 'order') return c === 'order';
    if (f === 'balance' || f === 'prerequisite' || f === 'non_obtainable') return c === 'err' && failureCategory(row) === f;
    if (f === 'ok') return c === 'ok';
    if (f === 'warn') return c === 'warn' || c === 'nomap' || c === 'idle' || c === 'nomanifest';
    if (f === 'decode') return c === 'decode';
    if (f === 'err') return c === 'err';
    return true;
  }

  function looksDeserialized(s) {
    if (!s || typeof s !== 'string') return false;
    var v = String(s).trim().replace(/^['"]|['"]$/g, '');
    if (!v) return false;
    if (v.indexOf('@U') === 0) return false;
    if (v.indexOf('||') >= 0 || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(v)) return true;
    if (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*\{/.test(v)) return true;
    return false;
  }

  function toDecodeSerials(serials) {
    var out = [];
    var normBr =
      typeof window.__stxNormalizeDeserializedInput === 'function'
        ? window.__stxNormalizeDeserializedInput
        : function (x) {
            return String(x || '').trim().replace(/^['"]|['"]$/g, '');
          };
    for (var i = 0; i < serials.length; i++) {
      var s = serials[i];
      if (looksDeserialized(s)) {
        out.push(normBr(s));
      } else {
        out.push(s);
      }
    }
    return out;
  }

  function isInvalidSerialDecodeError(err) {
    var s = String(err || '').toLowerCase();
    return s.indexOf('not a valid borderlands 4 item serial') >= 0 || s.indexOf('magic header') >= 0;
  }

  function altDecodeCandidates(rawSerial) {
    var out = [];
    var raw = String(rawSerial || '').trim().replace(/^['"]|['"]$/g, '');
    if (!raw) return out;
    out.push(raw);
    var normBr = typeof window.__stxNormalizeDeserializedInput === 'function' ? window.__stxNormalizeDeserializedInput : null;
    var normed = normBr ? String(normBr(raw) || '').trim() : raw;
    if (normed && out.indexOf(normed) < 0) out.push(normed);
    var serialize = typeof window.serializeToBase85 === 'function' ? window.serializeToBase85 : null;
    if (serialize) {
      try {
        var b1 = String(serialize(raw, 17, true) || '').trim();
        if (b1 && out.indexOf(b1) < 0) out.push(b1);
      } catch (_) {}
      try {
        var b2 = String(serialize(normed, 17, true) || '').trim();
        if (b2 && out.indexOf(b2) < 0) out.push(b2);
      } catch (_) {}
    }
    return out;
  }

  function buildRow(serial, decodeResult, validation, dropText) {
    return {
      serial: serial,
      decodeOk: !!(decodeResult && decodeResult.success),
      decodeError: decodeResult && !decodeResult.success ? String(decodeResult.error || '') : '',
      validation: validation,
      dropText: dropText || '—',
      rawDecode: decodeResult
    };
  }

  function processDecodeBatch(serials, decodeResults, itemLevel, strictMode) {
    var out = [];
    var i;
    var serial;
    var dr;
    var v;
    var dropTxt;
    var helpers = window.LegitDecodeHelpers;
    for (i = 0; i < serials.length; i++) {
      serial = serials[i];
      dr = decodeResults[i];
      if (!dr || !dr.success) {
        var partial=dr && helpers.validateFailedSerialPrefix && helpers.validateFailedSerialPrefix(serial,dr.error);
        out.push(buildRow(serial, dr || { success: false, error: 'no result' }, partial || null, '—'));
        continue;
      }
      /* rawSerial must be deserialized `{fam:id}` text — Base85 (@U) breaks Critical dup/wrong-root expand. */
      v = helpers.validateDecodedSerial(dr, {
        strictMode: strictMode !== false,
        itemLevel: itemLevel,
        relaxInvUniLegDeps: false,
        invTagFailuresAsErr: true,
        detectPlainFrameUniLeg: true,
        failOffPoolNamedLegendaryBarrels: false,
        rawSerial: (dr && dr.deserialized) || serial,
        bulkCheatAuditMode: true
      });
      dropTxt = '—';
      if (typeof window.CC_ITEMPOOL_DROP_CHECK !== 'undefined' && window.CC_ITEMPOOL_DROP_CHECK.getDropSource) {
        try {
          dropTxt = window.CC_ITEMPOOL_DROP_CHECK.getDropSource(dr, dr.resolvedParts || []);
        } catch (e) {
          dropTxt = '—';
        }
      }
      out.push(buildRow(serial, dr, v, dropTxt));
    }
    return out;
  }

  function updateKpis() {
    var rows = state.rows;
    var n = rows.length;
    var dec = 0;
    var ok = 0;
    var wrn = 0;
    var decodeFail = 0;
    var nomanifest = 0;
    var legitErr = 0;
    var orderCount = 0;
    var subNomap = 0;
    var subWarn = 0;
    var subIdle = 0;
    var dropModded = 0;
    var okDropModded = 0;
    var i;
    var r;
    var c;
    var dropLc;
    for (i = 0; i < n; i++) {
      r = rows[i];
      if (r.decodeOk) dec++;
      c = classifyRow(r);
      dropLc = String(r.dropText || '').trim().toLowerCase();
      if (dropLc === 'modded') {
        dropModded++;
        if (c === 'ok') okDropModded++;
      }
      if (c === 'ok') ok++;
      else if (c === 'order') orderCount++;
      else if (c === 'decode') decodeFail++;
      else if (c === 'nomanifest') nomanifest++;
      else if (c === 'err') legitErr++;
      else {
        wrn++;
        if (c === 'nomap') subNomap++;
        else if (c === 'warn') subWarn++;
        else if (c === 'idle') subIdle++;
      }
    }
    $('k-total').textContent = String(n);
    var elDup = $('k-dup-merged');
    if (elDup) {
      if (state.inputPreserveDups) elDup.textContent = '—';
      else elDup.textContent = String(state.inputDupMerged != null ? state.inputDupMerged : 0);
    }
    if ($('k-decoded')) $('k-decoded').textContent = String(dec);
    $('k-ok').textContent = String(ok);
    $('k-warn').textContent = String(wrn + nomanifest);
    renderFailureGroups();
    var elDf = $('k-decode-fail');
    var elNm = $('k-nomanifest');
    var categories = {balance:0, order:0, prerequisite:0, non_obtainable:0};
    rows.forEach(function (row) { if (classifyRow(row) === 'err') categories[failureCategory(row)]++; });
    if ($('bv-result-headline')) $('bv-result-headline').textContent = summaryText(n, ok, legitErr, wrn+nomanifest,decodeFail,categories.non_obtainable,orderCount);
    if ($('k-valid')) $('k-valid').textContent = String(ok);
    if ($('k-invalid')) $('k-invalid').textContent = String(n-ok);
    if ($('k-order')) $('k-order').textContent = String(orderCount);
    ['prerequisite', 'non_obtainable'].forEach(function (key) {
      var el = $('k-' + key); if (el) el.textContent = String(categories[key]);
    });
    if ($('bv-extra-results')) {
      $('bv-extra-results').hidden = !(wrn + nomanifest + decodeFail);
      $('k-warn').closest('button').hidden = !(wrn+nomanifest);
      $('k-decode-fail').closest('button').hidden = !decodeFail;
    }
    var elLe = $('k-legit-err');
    if (elDf) elDf.textContent = String(decodeFail);
    if (elNm) elNm.textContent = String(nomanifest);
    if (elLe) elLe.textContent = String(categories.balance);
    var elDm = $('k-drop-modded');
    var elOdm = $('k-ok-drop-modded');
    if (elDm) elDm.textContent = String(dropModded);
    if (elOdm) elOdm.textContent = String(okDropModded);
    var sum = ok + orderCount + wrn + decodeFail + nomanifest + legitErr;
    var rec = $('k-reconcile');
    if (rec) {
      var uncDetail = '';
      if (wrn) {
        var ubits = [];
        if (subNomap) ubits.push('no map ×' + subNomap);
        if (subWarn) ubits.push('warn ×' + subWarn);
        if (subIdle) ubits.push('idle ×' + subIdle);
        uncDetail = ' (' + ubits.join(', ') + ')';
      }
      var parts = [String(ok) + ' passed'];
      if (orderCount) parts.push(String(orderCount) + ' order issue' + (orderCount === 1 ? '' : 's'));
      parts.push(String(wrn) + ' need verification');
      if (decodeFail) parts.push(String(decodeFail) + ' decode fail');
      if (nomanifest) parts.push(String(nomanifest) + ' no manifest');
      if (legitErr) parts.push(String(legitErr) + ' modded');
      rec.textContent =
        n ? 'Click a result card to see those items. Passed means the parts and level are allowed; it cannot prove an item was never edited.' : '';
      if (sum !== n) rec.textContent += ' Count mismatch — please export a report.';
      if (!state.inputPreserveDups && state.inputDupMerged > 0) {
        rec.textContent +=
          ' · ' + String(state.inputDupMerged) + ' duplicate input line(s) merged (same serial text; enable Keep duplicate lines for one row each).';
      } else if (state.inputPreserveDups && n > 0) {
        rec.textContent += ' · duplicate lines kept as separate rows';
      }

    }
  }

  function readableSlot(slot) {
    var labels = {inv_comp:'Rarity',body_acc:'Body accessory',barrel_acc:'Barrel accessory',scope_acc:'Scope accessory',magazine_acc:'Magazine accessory',body_ele:'Primary element',secondary_ele:'Secondary element',passive_points:'Skill point',primary_augment:'Primary augment',secondary_augment:'Secondary augment'};
    return labels[slot] || String(slot || 'Part').replace(/_/g,' ').replace(/\bacc\b/g,'accessory');
  }

  function readablePart(name) {
    return String(name || 'Unidentified part').replace(/^part_/i,'').replace(/_/g,' ');
  }

  function readableReason(row) {
    return readableRuleText(publicResult(row).reason);
  }

  function readableRuleText(reason) {
    reason = String(reason || '').replace(/^\[exact\]\s*/,'').replace(/Wrong inv comp part:/g,'Wrong rarity part:');
    // A roll can contain hundreds of copies. Keep the count and rule visible;
    // the complete identities remain in the expanded log and JSON evidence.
    reason = reason.replace(/^(.*parts; game maximum is \d+) \([\s\S]*\)\.$/,'$1.');
    var nodes = window.EXACT_ROLL_DATA && window.EXACT_ROLL_DATA.nodes || {};
    reason = reason.replace(/\b[a-z][a-z0-9_]*\.[a-z0-9_]+\b/gi,function (name) {
      var node = nodes[name.toLowerCase()];
      return node ? readablePart(node.name) : name;
    });
    return reason.replace(/\b(body_acc|barrel_acc|scope_acc|magazine_acc|body_ele|secondary_ele|passive_points|primary_augment|secondary_augment)\b/g,readableSlot);
  }

  function serializedPartRows(row) {
    var decoded = displayDecode(row), data = window.EXACT_ROLL_DATA || {};
    var resolved = decoded.resolvedParts || [], parts = [];
    var pattern = /\{(\d+)(?::(?:\[([\d\s,]+)\]|(\d+)))?\}|"([a-z0-9_]+\.[a-z0-9_]+)"/gi;
    var match;
    while ((match = pattern.exec(decoded.deserialized || '')) !== null) {
      var token = match[0];
      var keys = match[4] ? [match[4].toLowerCase()] : match[2] ? match[2].trim().split(/[\s,]+/).map(function (n) {return match[1]+':'+n;}) : [(match[3] == null ? decoded.itemTypeId : match[1])+':'+(match[3] == null ? match[1] : match[3])];
      keys.forEach(function (key) {
        var spawn = data.ids && data.ids[key] || key, node = data.nodes && data.nodes[spawn];
        var display = resolved.find(function (part) {return part.alpha_code && part.alpha_code.toLowerCase() === spawn || part.key === key;});
        parts.push({slot:readableSlot(node && node.slot || display && display.part_type),name:display && display.name || readablePart(node && node.name),token:keys.length > 1 ? '{'+key+'}' : token});
      });
    }
    return parts;
  }

  function serializedPartsHtml(row) {
    var parts=serializedPartRows(row);
    return parts.length ? '<ol class="bv-parts-list">'+parts.map(function (part) {return '<li><span>'+escapeHtml(part.slot)+'</span><strong>'+escapeHtml(part.name)+'</strong><code>'+escapeHtml(part.token)+'</code></li>';}).join('')+'</ol>' : '<p class="muted">'+(row.decodeOk ? 'Part names are not available for this item.' : 'Read the serial before its parts can be shown.')+'</p>';
  }

  function itemDetailsHtml(row) {
    var decoded = displayDecode(row), ls = row.validation && row.validation.legitState;
    var partial=partialRuleFailure(row);
    var log = ls && ls.details || [], readable = decoded.deserialized || '';
    var failures = ls && ls.exactRollEvidence && ls.exactRollEvidence.failures || [];
    var readableFailures = Array.from(new Set(failures.map(readableRuleText)));
    return '<details class="bv-item-details"><summary>Parts, source &amp; evidence</summary>'+
      (readableFailures.length ? '<section class="bv-rule-explanations"><h3>Rules that failed</h3><ul>'+readableFailures.slice(0,8).map(function (line) {return '<li>'+escapeHtml(line)+'</li>';}).join('')+'</ul>'+(readableFailures.length>8 ? '<p class="small muted">'+(readableFailures.length-8)+' more distinct failures are included in the technical log and report.</p>' : '')+'</section>' : '')+
      (!row.decodeOk && row.decodeError ? '<section class="bv-rule-explanations"><h3>Read error</h3><p>'+escapeHtml(row.decodeError)+'</p></section>' : '')+
      '<div class="bv-detail-grid">'+
      '<section><h3>'+(partial ? 'Verified prefix parts' : 'Serialized parts')+'</h3><p class="small muted">'+(partial ? 'Only complete tokens before the parser stopped. The unparsed remainder is excluded.' : 'Shown in the order written in the serial.')+'</p>'+serializedPartsHtml(row)+'</section>'+
      '<section><h3>Drop source</h3>'+sourceHtml(row)+
      (readable ? '<h3>'+(partial ? 'Diagnostic prefix — not a repaired serial' : 'Readable serial')+'</h3><code class="bv-readable">'+escapeHtml(readable)+'</code><button type="button" class="btn bv-copy" data-copy-text="'+escapeHtml(readable)+'">'+(partial ? 'Copy diagnostic prefix' : 'Copy readable code')+'</button>' : '')+
      (log.length ? '<details class="bv-more"><summary>Technical check log ('+log.length+')</summary><ul class="bv-check-log">'+log.map(function (line) {return '<li>'+escapeHtml(line)+'</li>';}).join('')+'</ul></details>' : '')+
      '</section></div></details>';
  }

  function renderTable() {
    var body = $('bv-tbody');
    if (!body) return;
    var rows = state.rows.filter(rowMatchesFilter);
    var total = rows.length;
    var pages = Math.max(1, Math.ceil(total / PAGE));
    if (state.page >= pages) state.page = Math.max(0, pages - 1);
    var start = state.page * PAGE;
    var slice = rows.slice(start, start + PAGE);
    var html = '';
    var ri;
    var row;
    var cls;
    for (ri = 0; ri < slice.length; ri++) {
      row = slice[ri];
      cls = classifyRow(row);
      /* Display only; verdicts and exports continue to use publicResult. */
      var answer = publicResult(row);
      html += '<tr data-class="'+escapeHtml(cls)+'"'+(row.validation && row.validation.legitState && row.validation.legitState.nonObtainable ? ' data-usually-unobtainable="true"' : '')+'><td><article class="bv-result-card">'+
        '<div class="bv-result-heading"><div><h2>'+escapeHtml(rowItemLabel(row) || (row.decodeOk ? 'Unidentified item' : 'Unreadable serial'))+'</h2><div class="bv-item-meta">'+escapeHtml(rowItemMeta(row))+'</div></div>'+
        '<span class="bv-verdict legit-'+escapeHtml(cls)+'">'+escapeHtml(answer.label)+'</span></div>'+
        '<p class="bv-reason">'+escapeHtml(readableReason(row))+'</p>'+
        (partialRuleFailure(row) ? '<p class="small">Partial read: the verified tokens already break a game rule. This is a rejection, not a repaired or fully decoded item.</p>' : '')+
        '<div class="bv-serial-line"><code>'+escapeHtml(row.serial)+'</code><button type="button" class="btn bv-copy" data-copy-text="'+escapeHtml(row.serial)+'">Copy serial</button></div>'+
        itemDetailsHtml(row)+'</article></td></tr>';
    }
    if (!html) html = '<tr><td class="muted">'+(state.rows.length ? 'No items match this filter.' : 'Paste your serials above, then select Validate all.')+'</td></tr>';
    body.innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll('[data-result-filter]'), function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-result-filter') === state.filter));
    });
    var pg = $('bv-page');
    if (pg) pg.textContent = total ? 'Showing '+(start+1)+'–'+Math.min(start+slice.length,total)+' of '+total+' · page '+(state.page+1)+' of '+pages : 'No items';
  }

  async function runValidation() {
    if (state.running) return;
    var raw = ($('bv-input') && $('bv-input').value) || '';
    var modeSel = $('bv-mode');
    var mode = modeSel ? modeSel.value : 'auto';
    var fn = ($('bv-file') && $('bv-file').files && $('bv-file').files[0] && $('bv-file').files[0].name) || '';
    var preserveDupLines = !!($('bv-preserve-dup-lines') && $('bv-preserve-dup-lines').checked);
    var parsed = window.BulkSerialInputParse.extractSerials(raw, mode, fn, { preserveDuplicateLines: preserveDupLines });
    state.inputDupMerged = parsed.mergedDuplicateCount || 0;
    state.inputPreserveDups = preserveDupLines;
    var serials = parsed.serials;
    if (!serials.length) {
      statusLine('No serials found. Paste Base85 (@U) or deserialized format in YAML/JSON/txt, or choose a file.', 'warn');
      state.rows = [];
      updateKpis();
      renderTable();
      return;
    }
    state.running = true;
    state.page = 0;
    state.rows = [];
    var itemLevel = parseInt(($('bv-level') && $('bv-level').value) || '60', 10);
    if (!Number.isFinite(itemLevel)) itemLevel = 60;
    var strictMode = true;

    if (!window.LegitBuilderApi || typeof window.LegitBuilderApi.computeLegitValidationState !== 'function') {
      statusLine('Legit data not loaded — include legit-builder-core.js after manifest/NCS/data (same order as Legit Builder).', 'bad');
      state.running = false;
      updateKpis();
      renderTable();
      return;
    }
    if (!window.LegitDecodeHelpers || typeof window.LegitDecodeHelpers.validateDecodedSerial !== 'function') {
      statusLine('LegitDecodeHelpers missing — load legit-decode-validate.js after legit-builder-core.js.', 'bad');
      state.running = false;
      updateKpis();
      renderTable();
      return;
    }
    var ilHidden = document.getElementById('item-level');
    if (ilHidden) ilHidden.value = String(itemLevel);
    if (typeof window.decodeSerialsViaBridge !== 'function') {
      statusLine('decodeSerialsViaBridge missing (load cc-stx-decoder-bridge.js)', 'bad');
      state.running = false;
      updateKpis();
      renderTable();
      return;
    }

    var total = serials.length;
    var dupMerged = parsed.mergedDuplicateCount || 0;
    var decodeMsg =
      'Decoding ' +
      total +
      ' serial' +
      (total === 1 ? '' : 's') +
      ' (' +
      parsed.modeUsed +
      ')' +
      (dupMerged
        ? ' — ' + dupMerged + ' duplicate line(s) merged (identical text); enable Keep duplicate lines for one row each.'
        : '') +
      '…';
    statusLine(decodeMsg, dupMerged ? 'warn' : '');
    var allRows = [];
    var offset = 0;

    async function decodeChunk(chunk, rawChunk) {
      var dec = await window.decodeSerialsViaBridge(chunk, null, { enrichResolved: true });
      if (dec && dec.length === chunk.length) {
        var allInvalid = true;
        var i0;
        for (i0 = 0; i0 < dec.length; i0++) {
          if (dec[i0] && dec[i0].success) { allInvalid = false; break; }
          if (!isInvalidSerialDecodeError(dec[i0] && dec[i0].error)) { allInvalid = false; break; }
        }
        if (!allInvalid) return dec;

        // Retry one-by-one with alternate parse/serialize forms for txt/deserialized inputs.
        var retried = [];
        var ri;
        for (ri = 0; ri < rawChunk.length; ri++) {
          var src = rawChunk[ri];
          var cands = altDecodeCandidates(src);
          var best = null;
          var ci;
          for (ci = 0; ci < cands.length; ci++) {
            var one = await window.decodeSerialsViaBridge([cands[ci]], null, { enrichResolved: true });
            var r1 = one && one[0] ? one[0] : null;
            if (r1 && r1.success) { best = r1; break; }
            if (!best) best = r1;
          }
          retried.push(best || { success: false, error: 'decode timeout or empty' });
        }
        return retried;
      }
      var out = [];
      var j;
      for (j = 0; j < chunk.length; j++) {
        var one = await window.decodeSerialsViaBridge([chunk[j]], null, { enrichResolved: true });
        out.push(one && one[0] ? one[0] : { success: false, error: 'decode timeout or empty' });
      }
      return out;
    }

    var toDecode = toDecodeSerials(serials);
    while (offset < total) {
      var chunk = serials.slice(offset, offset + BATCH);
      var decodeChunkInput = toDecode.slice(offset, offset + BATCH);
      var dec = await decodeChunk(decodeChunkInput, chunk);
      var part = processDecodeBatch(chunk, dec, itemLevel, strictMode);
      var pi;
      for (pi = 0; pi < part.length; pi++) allRows.push(part[pi]);
      offset += BATCH;
      statusLine('Processed ' + Math.min(offset, total) + ' / ' + total + '…', '');
      await new Promise(function (r) {
        setTimeout(r, 0);
      });
    }
    state.rows = allRows;
    state.running = false;
    var doneParts = ['Done.', String(total), total === 1 ? 'serial' : 'serials', '· mode', parsed.modeUsed];
    if (dupMerged) doneParts.push('·', String(dupMerged), dupMerged === 1 ? 'dup line merged' : 'dup lines merged');
    doneParts.push(invTagBundleStatusSuffix());
    try {
      if (window.LegitDecodeHelpers && window.LegitDecodeHelpers.__version) {
        doneParts.push('·', String(window.LegitDecodeHelpers.__version));
      }
    } catch (_) {}
    statusLine(doneParts.join(' '), 'ok');
    updateKpis();
    renderTable();
  }

  function wire() {
    try {
      window.STX_BULK_CHEAT_AUDIT = true;
    } catch (eW) {}
    var invBadge = $('bv-inv-tag-badge');
    if (invBadge && window.INV_COMP_TAG_DATA && window.INV_COMP_TAG_DATA.partsByName) {
      invBadge.style.display = 'inline';
    }
    var runBtn = $('bv-run');
    var clr = $('bv-clear');
    var exJ = $('bv-export-json');
    var exC = $('bv-export-csv');
    var exM = $('bv-export-md');
    var inp = $('bv-input');
    var fi = $('bv-file');
    var filt = $('bv-filter');
    var prev = $('bv-prev');
    var next = $('bv-next');

    if (runBtn) runBtn.addEventListener('click', function () { runValidation(); });
    if (clr && inp) {
      clr.addEventListener('click', function () {
        inp.value = '';
        if (fi) fi.value = '';
        state.inputDupMerged = 0;
        state.inputPreserveDups = false;
        statusLine('Cleared.', '');
        updateKpis();
      });
    }
    if (exJ) exJ.addEventListener('click', exportJsonReport);
    if (exC) exC.addEventListener('click', exportCsv);
    if (exM) exM.addEventListener('click', exportMarkdownSummary);
    if ($('bv-export-readable')) $('bv-export-readable').addEventListener('click',exportReadableReport);
    var resultsBody = $('bv-tbody');
    if (resultsBody) resultsBody.addEventListener('click',async function (event) {
      var button = event.target.closest('[data-copy-text]');
      if (!button) return;
      try {
        await navigator.clipboard.writeText(button.getAttribute('data-copy-text'));
        button.textContent = 'Copied';
      } catch (_) {
        button.textContent = 'Select the code to copy';
      }
    });
    var exLegit = $('bv-export-legit-txt');
    var exModded = $('bv-export-modded-txt');
    var exFail = $('bv-export-fail-txt');
    if (exLegit) exLegit.addEventListener('click', function () { exportSerialListTxt('legit'); });
    if (exModded) exModded.addEventListener('click', function () { exportSerialListTxt('nonok'); });
    if (exFail) exFail.addEventListener('click', function () { exportSerialListTxt('fail'); });
    var exOkDm = $('bv-export-ok-drop-modded-txt');
    var exOkPool = $('bv-export-ok-drop-clean-txt');
    if (exOkDm) exOkDm.addEventListener('click', function () { exportSerialListTxt('ok_drop_modded'); });
    if (exOkPool) exOkPool.addEventListener('click', function () { exportSerialListTxt('ok_pool'); });
    if (filt) {
      filt.addEventListener('change', function () {
        state.filter = filt.value;
        state.page = 0;
        renderTable();
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-result-filter]'), function (button) {
      button.addEventListener('click', function () {
        state.filter = button.getAttribute('data-result-filter');
        state.page = 0;
        if (filt) filt.value = state.filter;
        renderTable();
        var table = $('bv-tbody');
        if (table) table.closest('.table-wrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    if (prev) prev.addEventListener('click', function () { if (state.page > 0) { state.page--; renderTable(); } });
    if (next) {
      next.addEventListener('click', function () {
        var rows = state.rows.filter(rowMatchesFilter);
        var pages = Math.max(1, Math.ceil(rows.length / PAGE));
        if (state.page < pages - 1) {
          state.page++;
          renderTable();
        }
      });
    }

    if (fi && inp) {
      fi.addEventListener('change', function () {
        var f = fi.files && fi.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          inp.value = String(reader.result || '');
        };
        reader.readAsText(f);
      });
    }

    var drop = $('bv-dropzone');
    if (drop && inp) {
      ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
        });
      });
      drop.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          inp.value = String(reader.result || '');
          statusLine('Loaded ' + f.name + ' — click Validate all.', 'ok');
        };
        reader.readAsText(f);
      });
    }

    function takeValidatorHandoff(key) {
      var v = null;
      try {
        v = localStorage.getItem(key);
        if (v != null && v !== '') {
          try { localStorage.removeItem(key); } catch (_) {}
          return v;
        }
      } catch (_) {}
      try {
        v = sessionStorage.getItem(key);
        if (v != null && v !== '') {
          try { sessionStorage.removeItem(key); } catch (_) {}
          return v;
        }
      } catch (_) {}
      return null;
    }
    try {
      if (/\bprefill_yaml=1\b/i.test(location.search || '')) {
        var yHand = takeValidatorHandoff('stx_bulk_validator_prefill_yaml');
        if (yHand && inp) {
          inp.value = yHand;
          if (mode) mode.value = 'yaml';
          statusLine('Loaded YAML from Save/YAML — click Validate all.', 'ok');
        }
      } else if (/\bprefill=1\b/i.test(location.search || '')) {
        var rawHand = takeValidatorHandoff('stx_bulk_validator_prefill');
        if (rawHand && inp) {
          inp.value = rawHand;
          statusLine('Loaded serial lines from Save/YAML — click Validate all.', 'ok');
        }
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
