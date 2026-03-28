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
    return v.indexOf('||') >= 0 || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(v);
  }

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
    var serialize = typeof window.serializeToBase85 === 'function' ? window.serializeToBase85 : null;
    var i;
    for (i = 0; i < serials.length; i++) {
      var s = serials[i];
      if (looksDeserialized(s) && serialize) {
        var n = norm(s);
        var b85 = serialize(n);
        toDecode.push(b85 || s);
      } else {
        toDecode.push(s);
      }
    }
    var raw = JSON.parse(window.stxDecodeBulk(JSON.stringify(toDecode)) || '[]');
    var variantToSerial = {};
    for (i = 0; i < serials.length; i++) {
      s = serials[i];
      variantToSerial[norm(toDecode[i])] = s;
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
