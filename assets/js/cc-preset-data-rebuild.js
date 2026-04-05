/**
 * cc-preset-data-rebuild.js
 * Decompression and lazy-loading for preset data blobs (COLLECTIBLES, MISSIONSETS, LOCATIONS, UNLOCKABLES).
 * Requires: pako, jsyaml, preset_data.js (PRESET_DATA_BLOBS)
 *
 * Data scope: blobs are bundled snapshots from game/toolbox extraction, not live game files.
 * New missions/collectibles/challenges after a game patch need a regenerated assets/data/preset_data.js
 * for "unlock all" style merges to include them.
 */
(function () {
  'use strict';

  var COLLECTIBLES = null;
  var MISSIONSETS = null;
  var LOCATIONS = null;
  var UNLOCKABLES = null;
  var _loaded = false;

  function decompressBlob(blob) {
    if (!blob || typeof blob !== 'string') return '';
    try {
      var binary = [];
      var atobFn = typeof atob === 'function' ? atob : (typeof window !== 'undefined' && window.atob) || null;
      if (!atobFn) return '';
      var decoded = atobFn(blob);
      for (var i = 0; i < decoded.length; i++) binary.push(decoded.charCodeAt(i));
      var compressed = new Uint8Array(binary);
      var pako = window.pako || (typeof pako !== 'undefined' ? pako : null);
      if (!pako || typeof pako.inflate !== 'function') return '';
      try {
        return pako.inflate(compressed, { to: 'string' });
      } catch (e1) {
        try { return pako.ungzip(compressed, { to: 'string' }); } catch (e2) {
          try { return pako.inflateRaw(compressed, { to: 'string' }); } catch (e3) { return ''; }
        }
      }
    } catch (e) { return ''; }
  }

  function loadYamlBlob(blob) {
    try {
      var decompressed = decompressBlob(blob);
      if (!decompressed) return null;
      var y = window.jsyaml || (typeof jsyaml !== 'undefined' ? jsyaml : null);
      if (!y || typeof y.load !== 'function') return null;
      var obj = y.load(decompressed);
      return obj && typeof obj === 'object' ? obj : null;
    } catch (e) { return null; }
  }

  function loadArrayBlob(blob) {
    try {
      var decompressed = decompressBlob(blob);
      if (!decompressed) return [];
      var data = decompressed.split(',');
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }

  function ensurePresetDataLoaded() {
    if (_loaded) return !!COLLECTIBLES && !!MISSIONSETS;
    var blobs = window.PRESET_DATA_BLOBS;
    if (!blobs || typeof blobs !== 'object') return false;
    if (blobs.COLLECTIBLES_COMPRESSED) COLLECTIBLES = loadYamlBlob(blobs.COLLECTIBLES_COMPRESSED) || {};
    if (blobs.MISSIONSETS_COMPRESSED) MISSIONSETS = loadYamlBlob(blobs.MISSIONSETS_COMPRESSED) || {};
    if (blobs.LOCATIONS_COMPRESSED) LOCATIONS = loadArrayBlob(blobs.LOCATIONS_COMPRESSED) || [];
    if (blobs.UNLOCKABLES_COMPRESSED) UNLOCKABLES = loadYamlBlob(blobs.UNLOCKABLES_COMPRESSED) || {};
    _loaded = true;
    return !!COLLECTIBLES && !!MISSIONSETS;
  }

  function getCollectibles() { ensurePresetDataLoaded(); return COLLECTIBLES || {}; }
  function getMissionsets() { ensurePresetDataLoaded(); return MISSIONSETS || {}; }
  function getLocations() { ensurePresetDataLoaded(); return LOCATIONS || []; }
  function getUnlockables() { ensurePresetDataLoaded(); return UNLOCKABLES || {}; }

  window.decompressBlob = decompressBlob;
  window.loadYamlBlob = loadYamlBlob;
  window.loadArrayBlob = loadArrayBlob;
  window.ensurePresetDataLoaded = ensurePresetDataLoaded;
  window.__ccPresetCollectibles = function () { return getCollectibles(); };
  window.__ccPresetMissionsets = function () { return getMissionsets(); };
  window.__ccPresetLocations = function () { return getLocations(); };
  window.__ccPresetUnlockables = function () { return getUnlockables(); };
})();
