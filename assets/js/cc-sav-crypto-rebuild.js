/**
 * cc-sav-crypto-rebuild.js
 * .sav <-> YAML conversion: AES-ECB decrypt/encrypt with Steam ID key derivation.
 * Requires: CryptoJS (cryptojs-inline.js), pako (pako-inline.js)
 */
(function () {
  'use strict';

  var STEAM_ID_STORAGE_KEY = 'stx_last_steam_id';

  function persistSteamId(steamId) {
    if (!steamId || typeof steamId !== 'string') return;
    var trimmed = steamId.trim();
    if (!trimmed || !/^\d{17}$/.test(trimmed)) return;
    try {
      localStorage.setItem(STEAM_ID_STORAGE_KEY, trimmed);
    } catch (e) {}
  }

  function loadSteamId() {
    try {
      var stored = localStorage.getItem(STEAM_ID_STORAGE_KEY) || '';
      if (stored) {
        var el = document.getElementById('steamIdInput');
        if (el && !el.value.trim()) el.value = stored;
      }
    } catch (e) {}
  }

  function wireSteamIdPersistence() {
    var el = document.getElementById('steamIdInput');
    if (!el) return;
    loadSteamId();
    el.addEventListener('blur', function () {
      var v = (el.value || '').trim();
      if (/^\d{17}$/.test(v)) {
        persistSteamId(v);
        if (window.selectedSaveFile && typeof window.convertSAVToYAML === 'function') {
          window.convertSAVToYAML();
        }
      }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = (el.value || '').trim();
        if (/^\d{17}$/.test(v)) {
          persistSteamId(v);
          if (window.selectedSaveFile && typeof window.convertSAVToYAML === 'function') {
            window.convertSAVToYAML();
          }
        }
      }
    });
  }

  var BASE_KEY = new Uint8Array([
    0x35, 0xEC, 0x33, 0x77, 0xF3, 0x5D, 0xB0, 0xEA,
    0xBE, 0x6B, 0x83, 0x11, 0x54, 0x03, 0xEB, 0xFB,
    0x27, 0x25, 0x64, 0x2E, 0xD5, 0x49, 0x06, 0x29,
    0x05, 0x78, 0xBD, 0x60, 0xBA, 0x4A, 0xA7, 0x87
  ]);

  function adler32(uint8) {
    var a = 1, b = 0;
    for (var i = 0; i < uint8.length; i++) {
      a = (a + uint8[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) >>> 0) | (a & 0xffff);
  }

  function littleEndianBytes(num, bytes) {
    var arr = new Uint8Array(bytes);
    for (var i = 0; i < bytes; i++) {
      arr[i] = num & 0xFF;
      num = Math.floor(num / 256);
    }
    return arr;
  }

  function deriveKeyFromSteamId(steamid) {
    if (!steamid) throw new Error('SteamID required (17-digit).');
    var digits = ('' + steamid).replace(/\D/g, '');
    var sid = BigInt(digits || '0');
    var sid_le = new Uint8Array(8);
    for (var i = 0; i < 8; i++) {
      sid_le[i] = Number((sid >> BigInt(i * 8)) & BigInt(0xFF));
    }
    var key = new Uint8Array(BASE_KEY);
    for (var i = 0; i < 8; i++) key[i] ^= sid_le[i];
    return key;
  }

  function uint8ArrayToWordArray(u8) {
    var words = [], i = 0, len = u8.length;
    while (i < len) {
      words.push(
        ((u8[i] || 0) << 24) | ((u8[i + 1] || 0) << 16) | ((u8[i + 2] || 0) << 8) | (u8[i + 3] || 0)
      );
      i += 4;
    }
    return CryptoJS.lib.WordArray.create(words, u8.length);
  }

  function wordArrayToUint8Array(wordArray) {
    var len = wordArray.sigBytes;
    var words = wordArray.words;
    var u8 = new Uint8Array(len);
    var offset = 0;
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var bytes = [
        (word >>> 24) & 0xFF,
        (word >>> 16) & 0xFF,
        (word >>> 8) & 0xFF,
        word & 0xFF
      ];
      for (var b = 0; b < 4 && offset < len; b++) {
        u8[offset++] = bytes[b];
      }
    }
    return u8;
  }

  function pkcs7Unpad(u8) {
    if (!u8 || !u8.length) throw new Error('Invalid decrypted payload');
    var padLen = u8[u8.length - 1] >>> 0;
    if (padLen < 1 || padLen > 16) throw new Error('Invalid PKCS7 padding');
    if (u8.length < padLen) throw new Error('Invalid PKCS7 padding length');
    for (var i = u8.length - padLen; i < u8.length; i++) {
      if ((u8[i] >>> 0) !== padLen) throw new Error('Invalid PKCS7 padding bytes');
    }
    return u8.slice(0, u8.length - padLen);
  }

  function pkcs7Pad(u8) {
    var padLen = 16 - (u8.length % 16 || 16);
    var out = new Uint8Array(u8.length + padLen);
    out.set(u8, 0);
    for (var i = u8.length; i < out.length; i++) out[i] = padLen;
    return out;
  }

  function u32FromLE(u8, off) {
    return (u8[off] | (u8[off + 1] << 8) | (u8[off + 2] << 16) | (u8[off + 3] << 24)) >>> 0;
  }

  function decryptSavBytesToYaml(cipherBytesU8, steamid) {
    var keyBytes = deriveKeyFromSteamId(steamid);
    var keyWA = uint8ArrayToWordArray(keyBytes);
    var cipherWA = uint8ArrayToWordArray(cipherBytesU8);
    var cp = CryptoJS.lib.CipherParams.create({ ciphertext: cipherWA });
    var plainWA = CryptoJS.AES.decrypt(cp, keyWA, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    var plainU8 = wordArrayToUint8Array(plainWA);
    var packed = pkcs7Unpad(plainU8);
    if (packed.length < 9) throw new Error('Decrypted payload too small');
    var trailer = packed.slice(packed.length - 8);
    var comp = packed.slice(0, packed.length - 8);
    var expectedAdler = u32FromLE(trailer, 0);
    var expectedLen = u32FromLE(trailer, 4);
    var yamlBytes = pako.inflate(comp);
    if ((yamlBytes.length >>> 0) !== expectedLen) {
      throw new Error('Length check failed (expected ' + expectedLen + ', got ' + yamlBytes.length + ')');
    }
    var actualAdler = (adler32(yamlBytes) >>> 0);
    if (actualAdler !== expectedAdler) {
      throw new Error('Integrity check failed (adler32 mismatch)');
    }
    return new TextDecoder('utf-8').decode(yamlBytes);
  }

  window.deriveKeyFromSteamId = deriveKeyFromSteamId;
  window.deriveKey = deriveKeyFromSteamId;
  window.uint8ArrayToWordArray = uint8ArrayToWordArray;
  window.wordArrayToUint8Array = wordArrayToUint8Array;
  window.decryptSavBytesToYaml = decryptSavBytesToYaml;
  window.decryptSav = decryptSavBytesToYaml;

  function getCharNameFromYaml(yamlStr) {
    if (!yamlStr || typeof yamlStr !== 'string') return '';
    var m = yamlStr.match(/char_name:\s*(.+)/);
    if (!m || !m[1]) return '';
    return String(m[1]).trim().toLowerCase().replace(/[^\w\-]/g, '').substring(0, 32) || '';
  }

  /** True when YAML looks like a profile.sav decode (domains / profile root, no character state block). */
  function isProfileYamlStructure(yamlStr) {
    if (!yamlStr || typeof yamlStr !== 'string') return false;
    if (/(^|\n)\s*state\s*:/m.test(yamlStr)) return false;
    if (/(^|\n)\s*domains\s*:/m.test(yamlStr)) return true;
    if (/(^|\n)\s*profile\s*:/m.test(yamlStr)) return true;
    if (/profile_guid\s*:/i.test(yamlStr)) return true;
    return false;
  }
  window.isProfileYamlStructure = isProfileYamlStructure;

  function getNextStbxFilename(ext, yamlStr) {
    ext = (ext || 'yaml').toLowerCase().replace(/^\./, '');
    var charName = getCharNameFromYaml(yamlStr || '');
    var base = isProfileYamlStructure(yamlStr || '') ? 'STBX-profile' : (charName ? 'STBX-' + charName : 'STBX');
    var storageKey = 'stbx_dl_' + base;
    var count = 0;
    try {
      count = parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;
    } catch (e) {}
    count += 1;
    try {
      localStorage.setItem(storageKey, String(count));
    } catch (e) {}
    return base + '-' + count + '.' + ext;
  }

  window.handleSaveFileSelect = function (event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    window.selectedSaveFile = file;
    window.selectedSaveFileName = file.name;
    window.currentSavFileName = file.name;
    var info = document.getElementById('sav-file-info');
    if (info) {
      info.style.display = 'block';
      var hint = /profile/i.test(file.name) ? ' (profile) ' : ' ';
      info.textContent = file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)' + hint + '— click Convert .sav to YAML';
    }
    var btn = document.getElementById('convertSAVToYAMLBtn');
    if (btn) {
      btn.disabled = false;
      btn.classList.add('glow-ready');
    }
  };

  window.convertSAVToYAML = async function () {
    var statusDiv = document.getElementById('yaml-status');
    var saveFile = window.selectedSaveFile || null;
    var input = document.getElementById('savFileInput');
    if (!saveFile && input && input.files && input.files[0]) saveFile = input.files[0];
    if (!saveFile) {
      var msg = 'Please select a .sav file first (Load .sav File).';
      if (statusDiv) { statusDiv.textContent = msg; statusDiv.style.color = 'rgba(0,255,200,0.4)'; }
      return alert(msg);
    }
    var steamInput = document.getElementById('steamIdInput');
    var steamId = (steamInput && steamInput.value ? steamInput.value.trim() : '') || '';
    if (!steamId) {
      steamId = prompt('Enter your 17-digit SteamID (required to decrypt .sav):') || '';
      steamId = steamId.trim();
      if (steamInput) steamInput.value = steamId;
    }
    if (!steamId) return alert('SteamID required to decrypt .sav');
    try {
      if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.textContent = 'Decrypting and converting .sav to YAML...';
        statusDiv.style.color = '#4caf50';
      }
      var bytes = await new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function (e) { resolve(new Uint8Array(e.target.result)); };
        fr.onerror = reject;
        fr.readAsArrayBuffer(saveFile);
      });
      var rawYaml = decryptSavBytesToYaml(bytes, steamId);
      persistSteamId(steamId);
      var downloadName = getNextStbxFilename('yaml', rawYaml);
      var ta = document.getElementById('yamlInput') || document.getElementById('fullYamlInput');
      if (ta) ta.value = rawYaml;
      if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(50);
      if (typeof window.syncYamlToFields === 'function') window.syncYamlToFields();
      if (typeof window.__updatePresetButtonsAvailability === 'function') window.__updatePresetButtonsAvailability();
      if (typeof window.__ccRenderRuntimeStatus === 'function') window.__ccRenderRuntimeStatus();
      try {
        var blob = new Blob([rawYaml], { type: 'text/yaml' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) { console.warn('YAML download failed:', e); }
      if (statusDiv) {
        statusDiv.textContent = 'Save file converted to YAML! YAML loaded and downloaded.';
        statusDiv.style.color = '#4caf50';
      }
      var btnSav = document.getElementById('convertSAVToYAMLBtn');
      if (btnSav) btnSav.classList.remove('glow-ready');
    } catch (err) {
      console.error('Failed to convert save file to YAML:', err);
      var msg = (err && err.message ? err.message : String(err)) || '';
      var isDecryptError = msg && !/SteamID required|Please select/i.test(msg);
      var userMsg = isDecryptError ? 'Please check Steam ID for this save.' : ('Failed to convert .sav to YAML: ' + msg);
      if (statusDiv) {
        statusDiv.textContent = isDecryptError ? 'Please check Steam ID for this save.' : ('Error: ' + msg);
        statusDiv.style.color = 'rgba(255,120,100,0.95)';
      }
      alert(userMsg);
      var btnSav2 = document.getElementById('convertSAVToYAMLBtn');
      if (btnSav2) btnSav2.classList.remove('glow-ready');
    }
  };

  window.saveYAMLToSAV = function () {
    try {
      var yamlTa = document.getElementById('yamlInput') || document.getElementById('fullYamlInput') || document.querySelector('textarea[id*="yaml"]');
      var yamlDataStr = (yamlTa && yamlTa.value ? yamlTa.value : '').trim();
      if (!yamlDataStr) return alert('No YAML in the editor to save.');
      var fileName = getNextStbxFilename('yaml', yamlDataStr);
      var blob = new Blob([yamlDataStr], { type: 'text/yaml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('saveYAMLToSAV failed:', e);
      alert('Save YAML failed: ' + (e && e.message ? e.message : e));
    }
  };

  window.convertYAMLToSAV = function () {
    try {
      var steamInput = document.getElementById('steamIdInput');
      var steamid = (steamInput && steamInput.value ? steamInput.value.trim() : '') || '';
      if (!steamid) {
        steamid = prompt('Enter your 17-digit SteamID (required to encrypt .sav):');
        if (!steamid) return alert('SteamID required to generate .sav');
        if (steamInput) steamInput.value = steamid;
      }
      if (!/^\d{17}$/.test(steamid)) {
        alert('Invalid Steam ID. Please enter your 17-digit SteamID64.');
        return;
      }
      var yamlTa = document.getElementById('yamlInput') || document.getElementById('fullYamlInput') || document.querySelector('textarea[id*="yaml"]');
      var yamlDataStr = (yamlTa && yamlTa.value ? yamlTa.value : '').trim();
      if (!yamlDataStr) return alert('No YAML found in the editor to convert.');
      var enc = new TextEncoder();
      var yamlBytes = enc.encode(yamlDataStr);
      var comp = pako.deflate(yamlBytes);
      var a32 = adler32(yamlBytes) >>> 0;
      var len = yamlBytes.length >>> 0;
      var trailer = new Uint8Array(8);
      trailer.set(littleEndianBytes(a32, 4), 0);
      trailer.set(littleEndianBytes(len, 4), 4);
      var packed = new Uint8Array(comp.length + trailer.length);
      packed.set(comp, 0);
      packed.set(trailer, comp.length);
      var padded = pkcs7Pad(packed);
      var keyBytes = deriveKeyFromSteamId(steamid);
      var keyWA = uint8ArrayToWordArray(keyBytes);
      var dataWA = uint8ArrayToWordArray(padded);
      var cipherParams = CryptoJS.AES.encrypt(dataWA, keyWA, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
      var cipherU8 = wordArrayToUint8Array(cipherParams.ciphertext);
      var fileName = getNextStbxFilename('sav', yamlDataStr);
      var blob = new Blob([cipherU8], { type: 'application/octet-stream' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      persistSteamId(steamid);
      alert('.sav file generated: ' + fileName);
    } catch (e) {
      console.error('convertYAMLToSAV error', e);
      alert('Error generating .sav: ' + (e && e.message ? e.message : e));
    }
  };

  function wireProfileSavInput() {
    var profileEl = document.getElementById('profileSavFileInput');
    if (!profileEl || profileEl.dataset.stxWired === '1') return;
    profileEl.dataset.stxWired = '1';
    profileEl.addEventListener('change', function (e) {
      if (typeof window.handleSaveFileSelect === 'function') window.handleSaveFileSelect(e);
      profileEl.value = '';
    });
  }

  function onDomReadySavUi() {
    wireSteamIdPersistence();
    wireProfileSavInput();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReadySavUi);
  } else {
    onDomReadySavUi();
  }
})();
