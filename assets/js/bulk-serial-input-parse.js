/**
 * Extract Base85 (@U) or deserialized serials from pasted YAML, JSON, or plain text.
 */
(function () {
  'use strict';

  function looksDeserialized(s) {
    if (!s || typeof s !== 'string') return false;
    var v = s.trim().replace(/^['"]|['"]$/g, '');
    if (!v) return false;
    if (v.indexOf('@U') === 0) return false;
    return v.indexOf('||') >= 0 || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(v);
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
      if (v.indexOf('@U') === 0 || looksDeserialized(v)) out.push(v);
    }
    if (out.length) return uniqueSerials(out);
    var loose = text.match(/@U[^\s"'`,\]}]+/g) || [];
    if (loose.length) return uniqueSerials(loose);
    for (li = 0; li < lines.length; li++) {
      v = lines[li].trim().replace(/^['"]|['"]$/g, '');
      if (v && looksDeserialized(v)) out.push(v);
    }
    return uniqueSerials(out);
  }

  function extractJsonStrings(node, out) {
    if (node == null) return;
    if (typeof node === 'string') {
      var t = node.trim();
      if (t.indexOf('@U') === 0 || looksDeserialized(t)) out.push(t);
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
    var text = String(raw || '').replace(/\r\n?/g, '\n');
    var lines = text.split('\n');
    var out = [];
    var i;
    var trimmed;
    var match;
    for (i = 0; i < lines.length; i++) {
      trimmed = lines[i].trim();
      if (!trimmed) continue;
      match = trimmed.match(/@U[^\s"'`,\]}]+/);
      out.push(match ? match[0] : trimmed.replace(/^['"]|['"]$/g, ''));
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
    uniqueSerials: uniqueSerials
  };
})();
