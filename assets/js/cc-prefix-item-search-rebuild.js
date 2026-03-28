/**
 * cc-prefix-item-search-rebuild.js
 * Prefix/Item Search and Add - search bundled serials by name, prefix, or ID.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  var serialsData = null;
  var lastSelected = null;

  var loadPromise = null;
  function loadSerials() {
    if (serialsData) return Promise.resolve(serialsData);
    if (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) {
      serialsData = window.STX_SERIALS_DATA.serials;
      return Promise.resolve(serialsData);
    }
    if (loadPromise) return loadPromise;
    var proto = (typeof location !== 'undefined' && location.protocol) || '';
    if (proto === 'file:' || proto === 'chrome-extension:' || proto === 'moz-extension:') {
      serialsData = [];
      loadPromise = Promise.resolve(serialsData);
      return loadPromise;
    }
    loadPromise = fetch('./assets/data/serials.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        serialsData = data && data.serials ? data.serials : [];
        return serialsData;
      })
      .catch(function (e) {
        serialsData = [];
        console.warn('Could not load serials.json. Click "Load from file" or use embedded serials.', e);
        return serialsData;
      });
    return loadPromise;
  }

  function getSearchText() {
    var el = byId('prefixItemSearchInput');
    return el ? String(el.value || '').trim().toLowerCase() : '';
  }

  function matches(item, q) {
    if (!q) return true;
    var name = String(item.name || '').toLowerCase();
    var serial = String(item.serial || '').toLowerCase();
    if (name.indexOf(q) >= 0) return true;
    if (serial.indexOf(q) >= 0) return true;
    if (window.parseSerialMeta) {
      var meta = window.parseSerialMeta(item.serial);
      var idStr = (meta.familyId != null && meta.itemId != null) ? (meta.familyId + ':' + meta.itemId) : '';
      if (idStr && idStr.indexOf(q) >= 0) return true;
      if (meta.name && String(meta.name).toLowerCase().indexOf(q) >= 0) return true;
    }
    return false;
  }

  function renderResults(items) {
    var el = byId('prefixItemSearchResults');
    if (!el) return;
    el.innerHTML = '';
    if (!items || !items.length) {
      el.innerHTML = '<div style="color:rgba(255,255,255,0.6);font-size:0.9em;">No matches.</div>';
      return;
    }
    items.slice(0, 100).forEach(function (item, idx) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px;background:rgba(0,200,255,0.06);border-radius:6px;margin-bottom:6px;border:1px solid rgba(0,200,255,0.15);cursor:pointer;';
      row.setAttribute('data-serial', item.serial || '');
      var name = item.name || 'Unknown';
      var meta = window.parseSerialMeta ? window.parseSerialMeta(item.serial) : {};
      var level = Number.isFinite(meta.level) ? ' Lv' + meta.level : '';
      var idStr = (meta.familyId != null && meta.itemId != null) ? ' (' + meta.familyId + ':' + meta.itemId + ')' : '';
      row.innerHTML = '<div style="flex:1;color:rgba(255,255,255,0.95);font-size:0.9em;">' + escapeHtml(name + level + idStr) + '</div>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to editor">Editor</button>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to YAML">YAML</button>';
      var btns = row.querySelectorAll('button');
      btns[0].addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.importSerialToEditor) window.importSerialToEditor(item.serial);
      });
      btns[1].addEventListener('click', function (e) {
        e.stopPropagation();
        lastSelected = item;
        if (window.appendSerialToYAML && window.appendSerialToYAML(item.serial)) {
          var drawer = byId('rp-saveyaml-drawer');
          if (drawer) { drawer.classList.add('rp-open'); document.body.classList.add('rp-saveyaml-drawer-open'); }
        } else {
          alert('Load a YAML file first.');
        }
      });
      row.addEventListener('click', function () { lastSelected = item; });
      el.appendChild(row);
    });
    if (items.length > 100) {
      var more = document.createElement('div');
      more.style.cssText = 'color:rgba(255,255,255,0.6);font-size:0.85em;margin-top:6px;';
      more.textContent = 'Showing first 100 of ' + items.length + '. Refine search for more.';
      el.appendChild(more);
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function doSearch() {
    var q = getSearchText();
    var statusEl = byId('prefixItemSearchStatus');
    if (!serialsData) {
      if (statusEl) statusEl.textContent = 'Loading serials…';
      loadSerials().then(function () {
        if (statusEl) statusEl.textContent = serialsData.length + ' serials loaded.';
        applySearch();
      });
      return;
    }
    applySearch();
  }

  function applySearch() {
    var q = getSearchText();
    var statusEl = byId('prefixItemSearchStatus');
    if (!serialsData) return;
    var filtered = serialsData.filter(function (item) { return matches(item, q); });
    if (statusEl) statusEl.textContent = q ? (filtered.length + ' matches') : (serialsData.length + ' serials. Type to search.');
    renderResults(filtered);
  }

  function init() {
    var searchInput = byId('prefixItemSearchInput');
    var addEditorBtn = byId('prefixItemAddToEditorBtn');
    var addYamlBtn = byId('prefixItemAddToYamlBtn');

    if (searchInput) {
      searchInput.addEventListener('input', doSearch);
      searchInput.addEventListener('keyup', doSearch);
    }

    if (addEditorBtn) {
      addEditorBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = serialsData ? serialsData.filter(function (item) { return matches(item, q); }) : [];
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.importSerialToEditor) {
          window.importSerialToEditor(lastSelected.serial);
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }

    if (addYamlBtn) {
      addYamlBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = serialsData ? serialsData.filter(function (item) { return matches(item, q); }) : [];
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.appendSerialToYAML) {
          var ok = window.appendSerialToYAML(lastSelected.serial);
          if (ok) {
            var drawer = byId('rp-saveyaml-drawer');
            if (drawer) { drawer.classList.add('rp-open'); document.body.classList.add('rp-saveyaml-drawer-open'); }
          } else {
            alert('Load a YAML file first.');
          }
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }

    loadSerials().then(function () {
      var statusEl = byId('prefixItemSearchStatus');
      if (statusEl) {
        statusEl.textContent = serialsData.length
          ? serialsData.length + ' serials loaded. Type to search.'
          : 'Serials not loaded.';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
