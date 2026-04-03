/**
 * Shared STX serial batch decode (same logic as legacy/bl4-bulk-decoder iframe bridge).
 * Depends on globals from stx-bulk-decoder-main.js: initDecoder, stxDecodeBulk, __stxEnrichDecodeResult.
 */
(function () {
  'use strict';

  var initStarted = false;

  async function ensureDecoderForBridge() {
    if (window.stxDecodeBulk && window.stxDecoderReady) return;
    if (typeof window.initDecoder !== 'function') {
      throw new Error('initDecoder not available (load bulk decoder scripts first)');
    }
    if (!initStarted) {
      initStarted = true;
      await window.initDecoder();
    } else {
      await new Promise(function (r) { setTimeout(r, 50); });
      return ensureDecoderForBridge();
    }
  }

  function norm(s) {
    return String(s || '').trim().replace(/^['"]|['"]$/g, '');
  }

  function looksDeserialized(s) {
    if (!s || typeof s !== 'string') return false;
    var v = norm(s);
    if (!v) return false;
    if (v.indexOf('@U') === 0) return false;
    if (v.indexOf('||') >= 0 || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(v)) return true;
    // Some exports omit "||" before the brace tail; still a 4-word header + pipe segments.
    if (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*\{/.test(v)) return true;
    return false;
  }

  /** Compact Base85 body without @U prefix (same alphabet as cc-base85-rebuild). */
  function looksLikeRawBase85(s) {
    var v = norm(s);
    if (!v || v.length < 12) return false;
    if (v.indexOf('@U') === 0) return false;
    if (looksDeserialized(v)) return false;
    if (/^\d+\s*,/.test(v)) return false;
    return /^[0-9A-Za-z!#$%&()*+;<=>?@^_`{|}~\/-]+$/.test(v);
  }

  /**
   * If the tail starts with `{…}` or `"…"` but only a single `|` precedes it, WASM may reject it.
   * Also handle missing `||` before `{` when nicnl-style `ensureDoublePipe` applies.
   */
  function ensureDoublePipeBeforePartTail(s) {
    s = String(s || '').trim();
    if (!s) return s;
    if (s.indexOf('||') >= 0) return s;
    s = s.replace(/\|\s*(?=\{)/g, '|| ');
    s = s.replace(/\|\s*(?=")/g, '|| ');
    if (s.indexOf('||') >= 0) return s.replace(/\s+/g, ' ').trim();
    var m = s.match(/^([\s\S]+?)(\s+)(\{[\s\S]*)$/);
    if (m) {
      var head = m[1];
      if (/^[\d\s,|]+$/.test(head.replace(/\s+$/, ''))) {
        return (head + '||' + m[2] + m[3]).replace(/\s+/g, ' ').trim();
      }
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  /**
   * Save dumps / list exports often use space-separated ints inside `{fam:[a b c]}`.
   * The bundled BL4 WASM expects comma-separated lists: `{fam:[a,b,c]}` — otherwise it returns
   * "not a valid borderlands 4 item serial" for every row.
   */
  function normalizeDeserializedForWasm(s) {
    s = norm(s);
    if (!s) return s;

    // Normalize bracket lists: {243:[103 99]} -> {243:[103,99]}
    var out = s.replace(/\[([^\]]*)\]/g, function (full, inner) {
      var parts = String(inner || '')
        .trim()
        .split(/\s+/)
        .filter(function (x) {
          return /^\d+$/.test(x);
        });
      if (parts.length <= 1) return full;
      return '[' + parts.join(',') + ']';
    });

    out = ensureDoublePipeBeforePartTail(out);

    // Canonical whitespace; the JS serializer is picky about some odd spacing.
    out = out.replace(/\s+/g, ' ').trim();
    return out;
  }

  window.__stxNormalizeDeserializedInput = normalizeDeserializedForWasm;

  function variants(s) {
    var v = norm(s);
    if (!v) return [];
    var out = [v];
    if (v.length > 2 && v.indexOf('@U') === 0) out.push(v.slice(2));
    var seen = Object.create(null);
    var dedup = [];
    for (var i = 0; i < out.length; i++) {
      if (!seen[out[i]]) { seen[out[i]] = true; dedup.push(out[i]); }
    }
    return dedup;
  }

  /**
   * @param {string[]} serials
   * @param {{ enrichResolved?: boolean }} [options]
   * @returns {Promise<object[]>}
   */
  window.__stxDecodeSerialsBatch = async function (serials, options) {
    options = options || {};
    if (!Array.isArray(serials) || !serials.length) return [];
    await ensureDecoderForBridge();
    var toDecode = [];
    var i;
    for (i = 0; i < serials.length; i++) {
      var s = serials[i];
      var v0 = norm(s);
      if (looksDeserialized(s)) {
        // WASM b85.Decode only accepts @U…; pack via nicnl FromString+Serialize (stx-nicnl-serial-pack.js).
        var normD = normalizeDeserializedForWasm(s);
        var packed = normD;
        if (typeof window.__stxNicnlPackDeserialized === 'function') {
          try {
            var pu = window.__stxNicnlPackDeserialized(normD);
            if (pu && pu.indexOf('@U') === 0 && pu.length > 6) packed = pu;
          } catch (_) {}
        }
        if (packed === normD && typeof window.serializeToBase85 === 'function') {
          try {
            var b85 = window.serializeToBase85(normD, 17, false);
            if (b85 && b85.indexOf('@U') === 0 && b85.length > 6) packed = b85;
          } catch (_) {}
        }
        toDecode.push(packed);
      } else if (looksLikeRawBase85(s)) {
        toDecode.push(v0.indexOf('@U') === 0 ? v0 : '@U' + v0);
      } else {
        toDecode.push(s);
      }
    }
    var raw = JSON.parse(window.stxDecodeBulk(JSON.stringify(toDecode)) || '[]');
    var variantToSerial = {};
    for (i = 0; i < serials.length; i++) {
      s = serials[i];
      var v = norm(s);
      variantToSerial[norm(toDecode[i])] = s;
      variantToSerial[v] = s;
      if (looksDeserialized(s)) {
        var nd = normalizeDeserializedForWasm(s);
        variantToSerial[nd] = s;
        var mapB85 = function (pb) {
          if (pb && pb.indexOf('@U') === 0) {
            variantToSerial[norm(pb)] = s;
            if (pb.length > 2) variantToSerial[norm(pb.slice(2))] = s;
          }
        };
        if (typeof window.__stxNicnlPackDeserialized === 'function') {
          try {
            mapB85(window.__stxNicnlPackDeserialized(nd));
          } catch (_) {}
        }
        if (typeof window.serializeToBase85 === 'function') {
          try {
            mapB85(window.serializeToBase85(nd, 17, false));
          } catch (_) {}
        }
      }
      if (looksLikeRawBase85(s)) {
        variantToSerial['@U' + v] = s;
      }
      var vs = variants(s);
      for (var j = 0; j < vs.length; j++) variantToSerial[vs[j]] = s;
    }
    var byInput = {};
    for (var k = 0; k < raw.length; k++) {
      var r = raw[k];
      var ser = norm(r && r.input);
      if (!ser) continue;
      var canonical = variantToSerial[ser];
      if (canonical) byInput[norm(canonical)] = r;
    }
    var orderPreserved = raw.length === serials.length;
    var results = [];
    for (var n = 0; n < serials.length; n++) {
      var serial = serials[n];
      var sn = norm(serial);
      var row = orderPreserved && raw[n] && typeof raw[n] === 'object' ? raw[n] : byInput[sn];
      if (row && typeof row === 'object' && row !== null) {
        var entry = {};
        for (var key in row) {
          if (Object.prototype.hasOwnProperty.call(row, key)) entry[key] = row[key];
        }
        entry.input = serial;
        results.push(entry);
      } else {
        results.push({ input: serial, success: false, error: 'no matching decoder result' });
      }
    }
    if (options.enrichResolved && typeof window.__stxEnrichDecodeResult === 'function') {
      for (var ir = 0; ir < results.length; ir++) {
        if (results[ir] && results[ir].success) results[ir] = window.__stxEnrichDecodeResult(results[ir]);
      }
    }
    return results;
  };
})();
