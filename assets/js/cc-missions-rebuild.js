/**
 * Mission status editor — format-preserving status / ui_flags edits on character YAML.
 */
(function () {
  'use strict';

  var COMMON_STATUSES = [
    'completed',
    'Active',
    'InProgress',
    'NotStarted',
    'Completed',
    'Completed_PostFinished',
    'Completed_Finishing',
    'Failed',
    'Abandoned',
  ];

  var lastNodes = [];
  var lastYamlText = '';

  function byId(id) {
    return document.getElementById(id);
  }

  function yamlTextarea() {
    return byId('yamlInput') || byId('fullYamlInput') || document.querySelector('textarea[aria-label="YAML editor"]');
  }

  function getYamlTextSafe() {
    if (typeof window.getYamlText === 'function') {
      var w = window.getYamlText();
      return w && w.text ? String(w.text) : '';
    }
    var ta = yamlTextarea();
    return ta ? String(ta.value || '') : '';
  }

  function setYamlTextSafe(text) {
    if (typeof window.setYamlText === 'function') {
      window.setYamlText(text);
      return;
    }
    var ta = yamlTextarea();
    if (ta) ta.value = text;
  }

  function showMsg(text, isErr) {
    var el = byId('ccMissionsStatusMsg');
    if (!el) return;
    if (!text) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.style.display = 'block';
    el.style.color = isErr ? '#ffb8b0' : 'rgba(0,200,255,0.95)';
    el.textContent = text;
  }

  function nodeTypeForPath(path, parentKey) {
    var p = String(path || '');
    var pk = String(parentKey || '');
    if (/\.objectives\.[^.]+$/.test(p) || (p.indexOf('.objectives.') !== -1 && pk && !/^mission_/.test(pk))) {
      return 'objective';
    }
    if (/\.missions\.mission_/.test(p) || /^mission_/.test(pk)) return 'mission';
    if (/\.local_sets\.missionset_/.test(p) || /^missionset_/.test(pk)) return 'missionset';
    return 'other';
  }

  function matchesScope(type, scope) {
    if (!scope || scope === 'all') return true;
    if (scope === 'mission') return type === 'mission';
    if (scope === 'missionset') return type === 'missionset';
    if (scope === 'objective') return type === 'objective';
    return true;
  }

  function buildNodeLabel(stack, parentKey, statusVal) {
    var parts = [];
    for (var i = 0; i < stack.length; i++) {
      var k = stack[i].key;
      if (k === 'missions' || k === 'local_sets' || k === 'missions' || k === 'objectives') continue;
      if (/^missionset_/.test(k) || /^mission_/.test(k) || k === parentKey) parts.push(k);
    }
    if (parentKey && parts.indexOf(parentKey) === -1) parts.push(parentKey);
    var label = parts.length ? parts.join(' \u2192 ') : parentKey || 'status';
    return label + ' (' + statusVal + ')';
  }

  function scanMissionStatusNodes(text, scope) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    var nodes = [];
    var stack = [];
    var inMissions = false;
    var missionsRootIndent = -1;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!trimmed || trimmed.charAt(0) === '#') continue;

      var indent = (line.match(/^(\s*)/) || ['', ''])[1].length;
      var keyMatch = line.match(/^(\s*)([A-Za-z0-9_]+):\s*(.*?)(\s+#.*)?$/);
      if (!keyMatch) continue;

      var key = keyMatch[2];
      var rest = (keyMatch[3] || '').replace(/\s+#.*$/, '').trim();

      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();

      if (key === 'missions' && indent <= 2) {
        inMissions = true;
        missionsRootIndent = indent;
      } else if (inMissions && missionsRootIndent >= 0 && indent <= missionsRootIndent && key !== 'missions') {
        inMissions = false;
      }

      if (!inMissions) continue;

      if (rest === '') {
        stack.push({ indent: indent, key: key, line: i });
      }

      if (key !== 'status') continue;

      var statusVal = rest.replace(/^["']|["']$/g, '');
      var parentKey = stack.length ? stack[stack.length - 1].key : '';
      var path = stack.map(function (s) { return s.key; }).join('.');
      var type = nodeTypeForPath(path, parentKey);
      if (!matchesScope(type, scope)) continue;

      nodes.push({
        lineIndex: i,
        indent: indent,
        status: statusVal,
        parentKey: parentKey,
        path: path,
        type: type,
        label: buildNodeLabel(stack, parentKey, statusVal),
      });
    }
    return nodes;
  }

  function populateStatusSelect(nodes, currentStatus) {
    var sel = byId('ccMissionStatusSelect');
    if (!sel) return;
    var seen = Object.create(null);
    var opts = [];
    function add(v) {
      v = String(v || '').trim();
      if (!v || seen[v]) return;
      seen[v] = true;
      opts.push(v);
    }
    COMMON_STATUSES.forEach(add);
    for (var i = 0; i < nodes.length; i++) add(nodes[i].status);
    add(currentStatus);
    sel.innerHTML = '';
    for (var j = 0; j < opts.length; j++) {
      var o = document.createElement('option');
      o.value = opts[j];
      o.textContent = opts[j];
      sel.appendChild(o);
    }
    if (currentStatus && seen[currentStatus]) sel.value = currentStatus;
    else if (opts.length) sel.value = opts[0];
  }

  function populateNodeSelect(nodes, yamlLoaded) {
    var sel = byId('ccMissionNodeSelect');
    var meta = byId('ccMissionsFoundMeta');
    if (!sel) return;

    sel.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    if (!yamlLoaded) {
      placeholder.textContent = '(Load YAML to list missions)';
    } else if (!nodes.length) {
      placeholder.textContent = '(No mission status entries in this YAML)';
    } else {
      placeholder.textContent = '(Select a mission entry)';
    }
    sel.appendChild(placeholder);

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = n.label;
      sel.appendChild(opt);
    }

    if (meta) {
      meta.textContent = yamlLoaded
        ? (nodes.length ? nodes.length + ' status node(s) found' : 'No missions.status nodes')
        : '';
    }
  }

  function selectedNode() {
    var sel = byId('ccMissionNodeSelect');
    if (!sel || sel.value === '') return null;
    var idx = parseInt(sel.value, 10);
    if (!Number.isFinite(idx) || !lastNodes[idx]) return null;
    return lastNodes[idx];
  }

  function refreshMissionEditor() {
    var text = getYamlTextSafe().trim();
    var scopeEl = byId('ccMissionScopeSelect');
    var scope = scopeEl ? scopeEl.value : 'all';
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(text) : 'unknown';

    if (!text) {
      lastNodes = [];
      lastYamlText = '';
      populateNodeSelect([], false);
      populateStatusSelect([], '');
      return;
    }

    if (kind !== 'character' && !/^\s*missions\s*:/m.test(text) && !/\n\s+missions\s*:/m.test(text)) {
      lastNodes = [];
      lastYamlText = text;
      populateNodeSelect([], true);
      populateStatusSelect([], '');
      showMsg('Mission editor needs a character save YAML with a missions: block.', true);
      return;
    }

    lastYamlText = text;
    lastNodes = scanMissionStatusNodes(text, scope);
    populateNodeSelect(lastNodes, true);
    var node = selectedNode();
    populateStatusSelect(lastNodes, node ? node.status : '');
    if (lastNodes.length) showMsg('');
  }

  function applyStatusToLine(lines, node, newStatus) {
    var line = lines[node.lineIndex];
    var m = line.match(/^(\s*)status\s*:\s*(.*?)(\s+#.*)?$/i);
    if (!m) return false;
    lines[node.lineIndex] = m[1] + 'status: ' + newStatus + (m[3] || '');
    return true;
  }

  function applyMissionStatus() {
    var text = getYamlTextSafe();
    if (!text.trim()) {
      showMsg('Load or paste a character save YAML first.', true);
      return;
    }
    var node = selectedNode();
    if (!node) {
      showMsg('Select a mission entry from the list first.', true);
      return;
    }
    var statusEl = byId('ccMissionStatusSelect');
    var newStatus = statusEl ? String(statusEl.value || '').trim() : '';
    if (!newStatus) {
      showMsg('Choose a status value.', true);
      return;
    }
    var lines = text.replace(/\r\n?/g, '\n').split('\n');
    if (!applyStatusToLine(lines, node, newStatus)) {
      showMsg('Could not update status line (YAML may have changed). Refresh and try again.', true);
      refreshMissionEditor();
      return;
    }
    var updated = lines.join('\n');
    setYamlTextSafe(updated);
    if (typeof window.syncYamlToFields === 'function') window.syncYamlToFields();
    else refreshMissionEditor();
    showMsg('Updated status for ' + node.parentKey + ' \u2192 ' + newStatus + '.', false);
  }

  function processUiFlagsForNode(lines, node, addFlags) {
    var statusLine = node.lineIndex;
    var blockIndent = node.indent - 2;
    if (blockIndent < 0) return 0;
    var end = statusLine + 1;
    for (var j = statusLine + 1; j < lines.length; j++) {
      var t = lines[j].trim();
      if (!t || t.charAt(0) === '#') continue;
      var ind = (lines[j].match(/^(\s*)/) || ['', ''])[1].length;
      if (ind <= blockIndent) break;
      end = j + 1;
    }
    var uiIdx = -1;
    var k;
    for (k = statusLine + 1; k < end; k++) {
      if (/^\s*ui_flags\s*:/i.test(lines[k])) {
        uiIdx = k;
        break;
      }
    }
    if (addFlags) {
      if (uiIdx >= 0) {
        lines[uiIdx] = lines[uiIdx].replace(/^(\s*)ui_flags\s*:.*/i, '$1ui_flags: 1');
        return 1;
      }
      lines.splice(statusLine + 1, 0, ' '.repeat(node.indent) + 'ui_flags: 1');
      return 1;
    }
    if (uiIdx >= 0) {
      lines.splice(uiIdx, 1);
      return 1;
    }
    return 0;
  }

  function mutateUiFlags(addFlags) {
    var text = getYamlTextSafe();
    if (!text.trim()) {
      showMsg('Load or paste a character save YAML first.', true);
      return;
    }
    var scopeEl = byId('ccMissionScopeSelect');
    var scope = scopeEl ? scopeEl.value : 'all';
    var nodes = scanMissionStatusNodes(text, scope);
    if (!nodes.length) {
      showMsg('No mission status nodes found for ui_flags edits.', true);
      return;
    }
    var lines = text.replace(/\r\n?/g, '\n').split('\n');
    nodes.sort(function (a, b) { return b.lineIndex - a.lineIndex; });
    var changed = 0;
    for (var i = 0; i < nodes.length; i++) {
      changed += processUiFlagsForNode(lines, nodes[i], addFlags);
    }
    if (!changed) {
      showMsg(addFlags ? 'ui_flags already present (or no eligible nodes).' : 'No ui_flags lines to remove.', true);
      return;
    }
    setYamlTextSafe(lines.join('\n'));
    if (typeof window.syncYamlToFields === 'function') window.syncYamlToFields();
    else refreshMissionEditor();
    showMsg(addFlags ? 'Added ui_flags: 1 to mission blocks.' : 'Removed ui_flags lines from mission blocks.', false);
  }

  function wire() {
    var root = byId('ccMissionsEditor');
    if (!root || root.dataset.ccMissionsWired === '1') return;
    root.dataset.ccMissionsWired = '1';

    var scopeEl = byId('ccMissionScopeSelect');
    var nodeSel = byId('ccMissionNodeSelect');
    var applyBtn = byId('ccApplyMissionStatusBtn');
    var stripBtn = byId('ccStripUiFlagsBtn');
    var addBtn = byId('ccAddUiFlagsBtn');

    if (scopeEl) scopeEl.addEventListener('change', refreshMissionEditor);
    if (nodeSel) {
      nodeSel.addEventListener('change', function () {
        var node = selectedNode();
        populateStatusSelect(lastNodes, node ? node.status : '');
      });
    }
    if (applyBtn) applyBtn.addEventListener('click', applyMissionStatus);
    if (stripBtn) stripBtn.addEventListener('click', function () { mutateUiFlags(false); });
    if (addBtn) addBtn.addEventListener('click', function () { mutateUiFlags(true); });

    var ta = yamlTextarea();
    if (ta) {
      ta.addEventListener('input', function () {
        refreshMissionEditor();
      });
    }

    refreshMissionEditor();
  }

  window.__ccSyncMissionsEditorFromYaml = function () {
    refreshMissionEditor();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
