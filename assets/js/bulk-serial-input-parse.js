/**
 * Extract Base85 (@U) or deserialized serials from pasted YAML, JSON, or plain text.
 */
(function () {
  'use strict';

  function looksDeserialized(s) {
    if (!s || typeof s !== 'string') return false;
    var v = s.trim().replace(/^['"]|['"]$/g, '').replace(/^\uFEFF/, '');
    if (!v) return false;
    if (v.indexOf('@U') === 0) return false;
    if (v.indexOf('||') >= 0 || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(v)) return true;
    if (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*\{/.test(v)) return true;
    return false;
  }

  /** BL4 custom Base85 body without @U (one token per line). */
  function looksLikeRawBase85Token(s) {
    var v = String(s || '').trim().replace(/^['"]|['"]$/g, '').replace(/^\uFEFF/, '');
    if (!v || v.length < 12) return false;
    if (v.indexOf('@U') === 0) return false;
    if (looksDeserialized(v)) return false;
    if (/^\d+\s*,/.test(v)) return false;
    return /^[0-9A-Za-z!#$%&()*+;<=>?@^_`{|}~\/-]+$/.test(v);
  }

  /**
   * One STX line may be: plain serial, BOM-prefixed, quoted, TSV/CSV with junk before the code,
   * or a comment. YAML path often only captures the value; plain .txt used to push the whole line
   * and break WASM. Extract @U or deserialized body the same way for both.
   */
  function extractStxTokenFromLine(line) {
    var trimmed = String(line || '').replace(/^\uFEFF/g, '').trim();
    if (!trimmed) return null;
    if (/^#/.test(trimmed)) return null;
    if ((trimmed.charAt(0) === "'" && trimmed.charAt(trimmed.length - 1) === "'") || (trimmed.charAt(0) === '"' && trimmed.charAt(trimmed.length - 1) === '"')) {
      trimmed = trimmed.slice(1, -1);
    }
    var mU = trimmed.match(/@U[^\s"'`,\]}]+/);
    if (mU) return mU[0];
    var mRB = trimmed.match(/(?:^|[\s:;,\t])([0-9A-Za-z!#$%&()*+;<=>?@^_`{|}~\/-]{14,})(?:\s|$)/);
    if (mRB && looksLikeRawBase85Token(mRB[1])) return mRB[1];
    var mD = trimmed.match(/(\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*)/);
    if (mD) {
      var cand = mD[1].trim().replace(/\s+#.*$/, '');
      if (looksDeserialized(cand)) return cand;
    }
    trimmed = trimmed.replace(/\s+#.*$/, '').trim();
    if (looksDeserialized(trimmed)) return trimmed;
    return null;
  }

  function uniqueSerials(arr) {
    var seen = new Set();
    var out = [];
    var v;
    var i;
    for (i = 0; i < (arr || []).length; i++) {
      v = String(arr[i] == null ? '' : arr[i]).trim().replace(/^['"]|['"]$/g, '');
      if (!v) continue;
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }

  function detectMode(raw, filename) {
    var name = String(filename || '').toLowerCase();
    if (name.endsWith('.yaml') || name.endsWith('.yml') || name.endsWith('.save')) return 'yaml';
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.txt') || name.endsWith('.log')) return 'txt';
    var text = String(raw || '').trim();
    if (!text) return 'txt';
    if (/^\s*[{[]/.test(text)) return 'json';
    if (/(^|\n)\s*(?:-\s*)?serial\s*:\s*['"]?@U/m.test(text)) return 'yaml';
    if (/(^|\n)\s*[\w\-]+\s*:\s*/m.test(text) && /@U/.test(text)) return 'yaml';
    return 'txt';
  }

  function extractFromYaml(raw) {
    var text = String(raw || '').replace(/\r\n?/g, '\n');
    var out = [];
    var lines = text.split('\n');
    var li;
    var line;
    var m;
    var v;
    for (li = 0; li < lines.length; li++) {
      line = lines[li];
      m = line.match(/^\s*(?:-\s*)?serial\s*:\s*(.*?)\s*$/i);
      if (!m) continue;
      v = String(m[1] || '').trim();
      if (!v) continue;
      if ((v.charAt(0) === "'" && v.charAt(v.length - 1) === "'") || (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"')) {
        v = v.slice(1, -1);
      } else {
        v = v.replace(/\s+#.*$/, '').trim();
      }
      if (v.indexOf('@U') === 0 || looksDeserialized(v) || looksLikeRawBase85Token(v)) out.push(v);
    }
    if (out.length) return uniqueSerials(out);
    var loose = text.match(/@U[^\s"'`,\]}]+/g) || [];
    if (loose.length) return uniqueSerials(loose);
    for (li = 0; li < lines.length; li++) {
      var tok = extractStxTokenFromLine(lines[li]);
      if (tok) out.push(tok);
    }
    return uniqueSerials(out);
  }

  function extractJsonStrings(node, out) {
    if (node == null) return;
    if (typeof node === 'string') {
      var t = node.trim();
      if (t.indexOf('@U') === 0 || looksDeserialized(t) || looksLikeRawBase85Token(t)) out.push(t);
      return;
    }
    if (Array.isArray(node)) {
      var i;
      for (i = 0; i < node.length; i++) extractJsonStrings(node[i], out);
      return;
    }
    if (typeof node === 'object') {
      var keys = Object.keys(node);
      var ki;
      var key;
      var value;
      for (ki = 0; ki < keys.length; ki++) {
        key = keys[ki];
        value = node[key];
        if (String(key).toLowerCase() === 'serial' && typeof value === 'string') out.push(value.trim());
        else if (String(key).toLowerCase() === 'serials' && Array.isArray(value)) extractJsonStrings(value, out);
        else extractJsonStrings(value, out);
      }
    }
  }

  function extractFromJson(raw) {
    var text = String(raw || '').trim();
    if (!text) return [];
    try {
      var parsed = JSON.parse(text);
      var out = [];
      extractJsonStrings(parsed, out);
      return uniqueSerials(out);
    } catch (err) {
      var matches = text.match(/@U[^\s"'`,\]}]+/g) || [];
      var lines = text.split(/\r?\n/);
      var i;
      for (i = 0; i < lines.length; i++) {
        var t = lines[i].trim();
        if (t && looksDeserialized(t)) matches.push(t);
      }
      return uniqueSerials(matches);
    }
  }

  function extractFromTxt(raw) {
    var text = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    var lines = text.split('\n');
    var out = [];
    var i;
    var tok;
    for (i = 0; i < lines.length; i++) {
      tok = extractStxTokenFromLine(lines[i]);
      if (tok) out.push(tok);
    }
    return uniqueSerials(out);
  }

  /**
   * @param {string} raw
   * @param {'auto'|'yaml'|'json'|'txt'} mode
   * @param {string} [filename]
   * @returns {{ serials: string[], modeUsed: string, rawLineCount: number }}
   */
  function extractSerials(raw, mode, filename) {
    var text = String(raw || '');
    var rawLineCount = text.replace(/\r\n?/g, '\n').split('\n').filter(function (l) { return l.trim(); }).length;
    var used = mode === 'auto' ? detectMode(raw, filename) : mode;
    var serials = used === 'yaml' ? extractFromYaml(raw) : used === 'json' ? extractFromJson(raw) : extractFromTxt(raw);
    return { serials: serials, modeUsed: used, rawLineCount: rawLineCount };
  }

  window.BulkSerialInputParse = {
    extractSerials: extractSerials,
    detectMode: detectMode,
    uniqueSerials: uniqueSerials,
    extractStxTokenFromLine: extractStxTokenFromLine
  };
})();
