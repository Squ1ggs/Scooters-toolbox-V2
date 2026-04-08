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

  function rowItemLabel(row) {
    if (row.validation && row.validation.manifestItem) {
      return String(row.validation.manifestItem.name || row.validation.manifestItem.slug || '');
    }
    return '';
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
    if (/^\[composition\]/i.test(s)) return 'composition';
    if (/^\[raw\]/i.test(s)) return 'raw_composition';
    if (/^Exclusion:/i.test(s)) return 'exclusion';
    if (/^Comp allowlist:/i.test(s)) return 'comp_allowlist';
    if (/^Compatibility:/i.test(s)) return 'compatibility';
    if (/^Inv tags/i.test(s)) return 'inv_tags';
    if (/missing dependency tag/i.test(s)) return 'dependency';
    if (
      /^(Parts:|Sources:|Stats by|Stats known|Missing stat examples|Level range:|Item level:|Passes our checks|Rules passed:|Spawn claim:)/i.test(
        s
      )
    ) {
      return 'diagnostics';
    }
    if (/weight|schedule|spawn|off_pool/i.test(s)) return 'loot_meta';
    if (/NCS|slot order|wrong slot/i.test(s)) return 'ncs';
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
      if (/^(Exclusion:|Compatibility:|Inv tags|\[composition\]|\[raw\])/i.test(d)) return d;
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
      detail_line_categories: countDetailCategories(details),
      legit_details_all: details,
      validation: validationContextForExport(v),
      decode: compactDecodeForExport(dr)
    };
    if (!row.decodeOk) {
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
    if (ls) {
      legitLabel = ls.statusText || ls.status || '—';
      stCode = ls.status || '';
      notes = notesFromLegitState(ls);
      notesFull = notesFullFromLegitState(ls);
    } else if (row.validation && row.validation.mapped === false) {
      legitLabel = 'Uncertain (no slot map)';
      notes = 'Decode OK; no manifest parts matched NCS slots';
    } else if (row.validation && row.validation.phase === 'manifest') {
      legitLabel = 'No manifest';
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
    var flat = {
      bucket: c,
      serial: row.serial,
      decode_ok: row.decodeOk,
      decode_error: row.decodeError || '',
      item: rowItemLabel(row),
      legit_status: legitLabel,
      legit_status_code: stCode,
      notes: notes,
      notes_full: notesFull,
      off_pool_parts: offPool,
      off_pool_summary: offPoolSummary,
      stats: rowStatsLine(row),
      drop_hint: row.dropText || '—',
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
    var i;
    var r;
    var c;
    for (i = 0; i < n; i++) {
      r = rows[i];
      if (r.decodeOk) dec++;
      c = classifyRow(r);
      if (c === 'ok') ok++;
      else if (c === 'decode') decodeFail++;
      else if (c === 'nomanifest') nomanifest++;
      else if (c === 'err') legitErr++;
      else wrn++;
    }
    return {
      total: n,
      decoded_ok: dec,
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

  function downloadBlob(filename, mime, text) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
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
      alignment_definitions: {
        align_strict_ok_data:
          'Same as KPI OK (data): LegitBuilderApi status OK (bulk cheat-audit: may include unmapped rows with clean raw composition).',
        align_no_fail_data:
          'Decoded + manifest item resolved + not Fail (data).',
        align_mapped_no_fail_data:
          'Decoded + manifest + at least one mapped slot + not Fail (data). Excludes unmapped-only rows.',
        align_soft_ok_or_warn:
          'Mapped + legit state ok or warn (not err). Counts rows that are not hard-fail even if tag/source lines are warnings.',
        alignment_flags_note:
          'Bulk validator uses cheat-audit mode: composition (inv tags, comp allowlist, raw graph, weights, elements) drives Fail (data); spawn-table gaps and slot-order FYI do not reduce OK.'
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
      'align_strict_ok_data',
      'align_no_fail_data',
      'align_mapped_no_fail_data',
      'align_soft_ok_or_warn',
      'stats',
      'drop_hint',
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
          csvEscape(f.align_strict_ok_data ? 'yes' : 'no'),
          csvEscape(f.align_no_fail_data ? 'yes' : 'no'),
          csvEscape(f.align_mapped_no_fail_data ? 'yes' : 'no'),
          csvEscape(f.align_soft_ok_or_warn ? 'yes' : 'no'),
          csvEscape(f.stats),
          csvEscape(f.drop_hint),
          csvEscape(f.off_pool_summary || ''),
          csvEscape(f.notes_full)
        ].join(',')
      );
    }
    var name = 'bulk-serial-validation-' + new Date().toISOString().slice(0, 19).replace(/:/g, '') + '.csv';
    downloadBlob(name, 'text/csv;charset=utf-8', '\uFEFF' + lines.join('\r\n'));
    statusLine('Exported ' + rows.length + ' rows to ' + name + '.', 'ok');
  }

  function exportMarkdownSummary() {
    var rows = collectRowsForExport();
    if (!rows.length) {
      statusLine('Nothing to export — run validation first.', 'warn');
      return;
    }
    var s = getKpiSnapshot(rows);
    var hist = buildStatusHistogram(rows);
    var md = [];
    md.push('# Bulk serial validation export');
    md.push('');
    md.push('- Generated: ' + new Date().toISOString());
    md.push('- Rows in file: ' + rows.length);
    var vdm = getValidationDataBundleMeta();
    if (vdm && vdm.legit_decode_helpers_version) {
      md.push('- **Validator rules:** `' + String(vdm.legit_decode_helpers_version) + '`');
    }
    if (vdm && vdm.inv_comp_tag_data && vdm.inv_comp_tag_data.source_files && vdm.inv_comp_tag_data.source_files.length) {
      md.push(
        '- **Inv tag extract:** `' +
          vdm.inv_comp_tag_data.source_files.join('`, `') +
          '` · generated_at `' +
          String(vdm.inv_comp_tag_data.generated_at || '—') +
          '` · partsByName `' +
          String(vdm.inv_comp_tag_data.part_count != null ? vdm.inv_comp_tag_data.part_count : '—') +
          '`'
      );
    }
    if ($('bv-export-filtered') && $('bv-export-filtered').checked) md.push('- **Filter:** table filter `' + state.filter + '` only');
    md.push('');
    md.push('## Summary (same as KPI boxes)');
    md.push('');
    md.push('| Metric | Count |');
    md.push('|--------|------:|');
    md.push('| Serials | ' + s.total + ' |');
    md.push('| Decoded OK | ' + s.decoded_ok + ' |');
    md.push('| OK (data) | ' + s.ok_data + ' |');
    md.push('| Uncertain | ' + s.uncertain_or_map + ' |');
    md.push('| Decode failed | ' + s.decode_failed + ' |');
    md.push('| No manifest | ' + s.no_manifest + ' |');
    md.push('| Fail (data) | ' + s.fail_data + ' |');
    md.push('');
    var asum = buildAlignmentSummary(rows);
    md.push('## Alignment flags (export buckets)');
    md.push('');
    md.push('| Flag | Count |');
    md.push('|------|------:|');
    md.push('| align_strict_ok_data (our OK (data)) | ' + asum.align_strict_ok_data + ' |');
    md.push('| align_no_fail_data (not Fail (data)) | ' + asum.align_no_fail_data + ' |');
    md.push('| align_mapped_no_fail_data | ' + asum.align_mapped_no_fail_data + ' |');
    md.push('| align_soft_ok_or_warn | ' + asum.align_soft_ok_or_warn + ' |');
    md.push('');
    md.push('See JSON export `alignment_definitions` for meanings. Definitions apply to this validator and bundled data only.');
    md.push('');
    md.push('## Top status buckets (bucket + status_label)');
    md.push('');
    md.push('| Count | Key |');
    md.push('|------:|-----|');
    var hi;
    for (hi = 0; hi < Math.min(40, hist.length); hi++) {
      md.push('| ' + hist[hi].count + ' | `' + String(hist[hi].key).replace(/\|/g, '\\|') + '` |');
    }
    md.push('');
    md.push('## Sample rows (first 40)');
    md.push('');
    md.push('| Bucket | Item | Serial (full) | Legit | Notes (full) |');
    md.push('|--------|------|---------------|-------|--------------|');
    var si;
    var maxS = Math.min(40, rows.length);
    for (si = 0; si < maxS; si++) {
      var fr = flattenRowForExport(rows[si]);
      md.push(
        '| ' +
          fr.bucket +
          ' | ' +
          String(fr.item || '—').replace(/\|/g, '\\|') +
          ' | ' +
          String(fr.serial || '—').replace(/\|/g, '\\|') +
          ' | ' +
          String(fr.legit_status).replace(/\|/g, '\\|') +
          ' | ' +
          String(fr.notes_full || '—').replace(/\|/g, '\\|').slice(0, 200) +
          (String(fr.notes_full).length > 200 ? '…' : '') +
          ' |'
      );
    }
    md.push('');
    md.push('Use **Export CSV** or **Export JSON** for all rows.');
    var name = 'bulk-serial-validation-summary-' + new Date().toISOString().slice(0, 19).replace(/:/g, '') + '.md';
    downloadBlob(name, 'text/markdown;charset=utf-8', md.join('\n'));
    statusLine('Exported Markdown summary (' + rows.length + ' rows in KPI; sample 40).', 'ok');
  }

  function statusLine(msg, kind) {
    var el = $('bv-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'bv-status' + (kind ? ' ' + kind : '');
  }

  function classifyRow(row) {
    var bulkPage = typeof window !== 'undefined' && window.STX_BULK_CHEAT_AUDIT === true;
    if (!row.decodeOk) return 'decode';
    if (!row.validation || row.validation.phase === 'manifest') return 'nomanifest';
    if (row.validation.mapped === false) {
      var lsU = row.validation.legitState;
      if (lsU && lsU.status === 'ok') return 'ok';
      if (lsU && lsU.status === 'err') return 'err';
      return 'nomap';
    }
    var st = row.validation.legitState;
    if (!st) return 'idle';
    if (st.status === 'ok') return 'ok';
    if (st.status === 'err') return 'err';
    /* computeLegitValidationState can leave status 'idle' when a warn path was skipped (bulk); that was counted as uncertain — treat as OK on this page only. */
    if (bulkPage && st.status === 'idle') return 'ok';
    return 'warn';
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
    if (f === 'ok') return c === 'ok';
    if (f === 'warn') return c === 'warn' || c === 'nomap' || c === 'idle';
    if (f === 'err') return c === 'err' || c === 'decode' || c === 'nomanifest';
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
        out.push(buildRow(serial, dr || { success: false, error: 'no result' }, null, '—'));
        continue;
      }
      /* relaxInvUniLegDeps: false — enforce Nexus dependencytags in slot order (validateDecodedSerial no longer forces relax when bulkCheatAuditMode is on). */
      v = helpers.validateDecodedSerial(dr, {
        strictMode: strictMode !== false,
        itemLevel: itemLevel,
        relaxInvUniLegDeps: false,
        invTagFailuresAsErr: true,
        detectPlainFrameUniLeg: true,
        failOffPoolNamedLegendaryBarrels: false,
        rawSerial: serial,
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
    var subNomap = 0;
    var subWarn = 0;
    var subIdle = 0;
    var i;
    var r;
    var c;
    for (i = 0; i < n; i++) {
      r = rows[i];
      if (r.decodeOk) dec++;
      c = classifyRow(r);
      if (c === 'ok') ok++;
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
    $('k-decoded').textContent = String(dec);
    $('k-ok').textContent = String(ok);
    $('k-warn').textContent = String(wrn);
    var elDf = $('k-decode-fail');
    var elNm = $('k-nomanifest');
    var elLe = $('k-legit-err');
    if (elDf) elDf.textContent = String(decodeFail);
    if (elNm) elNm.textContent = String(nomanifest);
    if (elLe) elLe.textContent = String(legitErr);
    var sum = ok + wrn + decodeFail + nomanifest + legitErr;
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
      var parts = [String(ok) + ' OK', String(wrn) + ' uncertain' + uncDetail];
      if (decodeFail) parts.push(String(decodeFail) + ' decode fail');
      if (nomanifest) parts.push(String(nomanifest) + ' no manifest');
      if (legitErr) parts.push(String(legitErr) + ' fail (data)');
      rec.textContent =
        'Each KPI number lines up with the label above it. ' +
        parts.join(' + ') +
        ' = ' +
        String(sum) +
        ' serials' +
        (sum === n ? '' : ' — mismatch ' + String(n) + ', report this');
      if (dec !== n) {
        rec.textContent += ' · decoded ' + String(dec) + ' / ' + String(n) + ' rows';
      }
      if (!state.inputPreserveDups && state.inputDupMerged > 0) {
        rec.textContent +=
          ' · ' + String(state.inputDupMerged) + ' duplicate input line(s) merged (same serial text; enable Keep duplicate lines for one row each).';
      } else if (state.inputPreserveDups && n > 0) {
        rec.textContent += ' · duplicate lines kept as separate rows';
      }
    }
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
    var legitLabel;
    var details;
    var statsLine;
    var cls;
    for (ri = 0; ri < slice.length; ri++) {
      row = slice[ri];
      cls = classifyRow(row);
      legitLabel = '—';
      details = '';
      statsLine = '—';
      if (row.validation && row.validation.legitState) {
        legitLabel = row.validation.legitState.statusText || row.validation.legitState.status || '—';
        details = notesFromLegitState(row.validation.legitState);
        statsLine =
          'idRaw ' +
          (row.validation.legitState.statsIdRawFound != null ? row.validation.legitState.statsIdRawFound : '?') +
          '/' +
          (row.validation.legitState.partCount != null ? row.validation.legitState.partCount : '?') +
          ' · stats ' +
          (row.validation.legitState.statsAnyFound != null ? row.validation.legitState.statsAnyFound : '?') +
          '/' +
          (row.validation.legitState.partCount != null ? row.validation.legitState.partCount : '?');
      } else if (row.validation && row.validation.mapped === false) {
        legitLabel = 'Uncertain (no slot map)';
        details = 'Decode OK; no manifest parts matched NCS slots';
      } else if (row.validation && row.validation.phase === 'manifest') {
        legitLabel = 'No manifest';
        details = String(row.validation.manufacturer || '') + ' / ' + String(row.validation.itemType || '');
      }
      html +=
        '<tr data-class="' +
        escapeHtml(cls) +
        '">' +
        '<td><code title="' +
        escapeHtml(row.serial) +
        '">' +
        escapeHtml(row.serial) +
        '</code><div class="small muted">' +
        escapeHtml((row.validation && row.validation.manifestItem && (row.validation.manifestItem.name || row.validation.manifestItem.slug)) || '—') +
        '</div></td>' +
        '<td>' +
        (row.decodeOk ? '<span class="tag ok">OK</span>' : '<span class="tag bad">Fail</span>') +
        '</td>' +
        '<td>' +
        (row.validation && row.validation.manifestItem ? escapeHtml(row.validation.manifestItem.name || row.validation.manifestItem.slug || '') : '—') +
        '</td>' +
        '<td><span class="legit-' +
        escapeHtml(cls) +
        '">' +
        escapeHtml(legitLabel) +
        '</span></td>' +
        '<td class="mono small">' +
        escapeHtml(statsLine) +
        '</td>' +
        '<td class="small">' +
        escapeHtml(row.dropText) +
        '</td>' +
        '<td class="small">' +
        highlightReasonPhrases(highlightBarrelTokens(details)) +
        '</td>' +
        '</tr>';
    }
    if (!html) {
      html = '<tr><td colspan="7" class="muted">No rows match the filter.</td></tr>';
    }
    body.innerHTML = html;
    var pg = $('bv-page');
    if (pg) {
      pg.textContent = total ? 'Showing ' + (start + 1) + '–' + Math.min(start + slice.length, total) + ' of ' + total + ' (page ' + (state.page + 1) + '/' + pages + ')' : 'No rows';
    }
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
    if (filt) {
      filt.addEventListener('change', function () {
        state.filter = filt.value;
        state.page = 0;
        renderTable();
      });
    }
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
