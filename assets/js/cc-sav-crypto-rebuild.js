/**
 * cc-sav-crypto-rebuild.js
 * .sav <-> YAML conversion: AES-ECB decrypt/encrypt with Steam ID key derivation.
 * Decrypt path aligned with monokrome/bl4 crypto.rs (lenient PKCS7 + zlib; no mandatory footer verify).
 * Requires: CryptoJS (cryptojs-inline.js), pako (pako-inline.js)
 */
(function () {
  'use strict';

  var STEAM_ID_STORAGE_KEY = 'stx_last_steam_id';

  /**
   * Accept account identifiers in common forms:
   * - decimal digits (SteamID64-style)
   * - hex string (with/without 0x; Epic/account exports sometimes provide this)
   * Returns canonical decimal string for key derivation, or '' when invalid.
   */
  function normalizeAccountId(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    var digitsOnly = s.replace(/\D/g, '');
    if (/^\d{10,20}$/.test(digitsOnly)) return digitsOnly;
    var hex = s.toLowerCase();
    if (hex.indexOf('0x') === 0) hex = hex.slice(2);
    if (/^[0-9a-f]{16,32}$/.test(hex)) {
      try { return BigInt('0x' + hex).toString(10); } catch (_) { return ''; }
    }
    return '';
  }

  function persistSteamId(steamId) {
    if (!steamId || typeof steamId !== 'string') return;
    var trimmed = normalizeAccountId(steamId);
    if (!trimmed) return;
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
      var norm = normalizeAccountId(v);
      if (norm) {
        if (el.value !== norm) el.value = norm;
        persistSteamId(norm);
        if (window.selectedSaveFile && typeof window.convertSAVToYAML === 'function') {
          window.convertSAVToYAML();
        }
      }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = (el.value || '').trim();
        var norm = normalizeAccountId(v);
        if (norm) {
          if (el.value !== norm) el.value = norm;
          persistSteamId(norm);
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

  /** SteamID64 = this constant + 32-bit account number (individual / public). */
  var STEAM_ID64_BASE = BigInt('76561197960265728');

  function deriveKeyFromAccountBigInt(sid) {
    var sid_le = new Uint8Array(8);
    for (var i = 0; i < 8; i++) {
      sid_le[i] = Number((sid >> BigInt(i * 8)) & BigInt(0xFF));
    }
    var key = new Uint8Array(BASE_KEY);
    for (var j = 0; j < 8; j++) key[j] ^= sid_le[j];
    return key;
  }

  /**
   * Some users paste the 32-bit account id from Steam Community URLs; Epic keys differ.
   * Try a small ordered set of BigInts so one correct form still unlocks the save.
   */
  function accountBigIntCandidates(normalizedDecimalDigits) {
    var primary = BigInt(normalizedDecimalDigits || '0');
    var out = [];
    var seen = Object.create(null);
    function pushSid(s) {
      var t = s.toString();
      if (seen[t]) return;
      seen[t] = 1;
      out.push(s);
    }
    pushSid(primary);
    if (primary >= STEAM_ID64_BASE) {
      pushSid(primary - STEAM_ID64_BASE);
    }
    var low = primary & BigInt(0xffffffff);
    if (low > BigInt(0) && low !== primary) pushSid(low);
    return out;
  }

  function deriveKeyFromSteamId(steamid) {
    if (!steamid) throw new Error('Account ID required.');
    var digits = normalizeAccountId(steamid);
    if (!digits) throw new Error('Account ID required (SteamID64 decimal or supported hex ID).');
    return deriveKeyFromAccountBigInt(accountBigIntCandidates(digits)[0]);
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

  /** Matches bl4 crypto.rs: use standard PKCS7 when valid, else keep full decrypted buffer. */
  function pkcs7UnpadLenient(u8) {
    try {
      return pkcs7Unpad(u8);
    } catch (_) {
      return u8;
    }
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

  function inflateZlibToYamlBytes(unpadded, plainU8ForStrictPad) {
    var lastErr;
    var tryInflate = function (buf) {
      try {
        return pako.inflate(buf);
      } catch (e) {
        lastErr = e;
        return null;
      }
    };
    var y = tryInflate(unpadded);
    if (y) return y;
    if (unpadded.length > 9) {
      y = tryInflate(unpadded.slice(0, unpadded.length - 8));
      if (y) return y;
    }
    if (plainU8ForStrictPad && plainU8ForStrictPad.length) {
      try {
        var st = pkcs7Unpad(plainU8ForStrictPad);
        y = tryInflate(st);
        if (y) return y;
        if (st.length > 9) {
          y = tryInflate(st.slice(0, st.length - 8));
          if (y) return y;
        }
      } catch (_) {}
    }
    throw lastErr || new Error('Zlib decompression failed');
  }

  /**
   * Some saves (often profile.sav) have bytes before the zlib wrapper. Scan for CMF 0x78
   * and attempt inflate from each candidate offset (matches flate2 tolerating leading noise).
   */
  var ZLIB_OFFSET_SCAN_MAX = 4096;

  /**
   * pako may error on trailing bytes after the zlib stream; Python zlib.decompress often accepts.
   * Matches glacierpiece blcrypt.py: body = unpad(pt) or pt; zlib.decompress(body)
   */
  function zlibDecompressLikePython(body) {
    try {
      return pako.inflate(body);
    } catch (e1) {
      if (body.length > 9) {
        try {
          return pako.inflate(body.subarray(0, body.length - 8));
        } catch (e2) {}
      }
      throw e1;
    }
  }

  function glacierpieceDecryptBody(plainU8) {
    var body;
    try {
      body = pkcs7Unpad(plainU8);
    } catch (_) {
      body = plainU8;
    }
    return zlibDecompressLikePython(body);
  }

  /**
   * Reject false-positive inflates (noise); accept strict BL4 keys OR relaxed YAML-shaped text
   * (profile.sav roots vary — see github.com/glacierpiece/borderlands-4-save-utility blcrypt.py).
   */
  function isPlausibleBl4YamlBytes(u8) {
    if (!u8 || u8.length < 32) return false;
    var s = new TextDecoder('utf-8', { fatal: false }).decode(u8);
    var sample = s.slice(0, Math.min(8000, s.length));
    if (/\uFFFD/.test(sample.slice(0, 2000))) return false;
    var head = sample.slice(0, Math.min(4000, sample.length));
    if (
      /^\s*%YAML/m.test(head) ||
      /(^|[\r\n])\s*state\s*:/m.test(head) ||
      /(^|[\r\n])\s*domains\s*:/m.test(head) ||
      /(^|[\r\n])\s*profile\s*:/m.test(head) ||
      /(^|[\r\n])\s*unlockables\s*:/m.test(head) ||
      /profile_guid\s*:/i.test(head) ||
      /(^|[\r\n])\s*oak/i.test(head) ||
      /\boakgame\b/i.test(head) ||
      /gbx_/i.test(head) ||
      /(^|[\r\n])\s*version\s*:/m.test(head) ||
      /(save|game)_version\s*:/i.test(head) ||
      /(^|[\r\n])\s*bank\s*:/m.test(head) ||
      /(^|[\r\n])\s*metadata\s*:/m.test(head)
    ) {
      return true;
    }
    if (head.length < 40) return false;
    if (!/[\r\n]/.test(head) || !/:/.test(head)) return false;
    var check = head.slice(0, Math.min(500, head.length));
    var ok = 0;
    for (var i = 0; i < check.length; i++) {
      var c = check.charCodeAt(i);
      if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 0xd800) || (c > 0xdfff && c < 0x110000)) ok++;
    }
    return ok / check.length >= 0.82;
  }

  function tryInflateZlibAtScanOffsets(buf) {
    if (!buf || buf.length < 12) return null;
    var lim = Math.min(ZLIB_OFFSET_SCAN_MAX, buf.length - 8);
    for (var off = 0; off <= lim; off++) {
      if (buf[off] !== 0x78) continue;
      try {
        var out = pako.inflate(buf.subarray(off));
        if (isPlausibleBl4YamlBytes(out)) return out;
      } catch (_) {}
    }
    return null;
  }

  /** Buffers to try zlib on (bl4 uses unpad-or-full; profile may match raw AES output or tail trims). */
  function collectZlibInputCandidates(unpadded, plainU8) {
    var out = [];
    var seen = Object.create(null);
    function add(b) {
      if (!b || b.length < 12) return;
      var k = b.byteOffset + ':' + b.length;
      if (seen[k]) return;
      seen[k] = 1;
      out.push(b);
    }
    add(unpadded);
    add(plainU8);
    var k;
    for (k = 1; k <= 16; k++) {
      if (plainU8.length > k) add(plainU8.subarray(0, plainU8.length - k));
      if (unpadded.length > k) add(unpadded.subarray(0, unpadded.length - k));
    }
    return out;
  }

  /**
   * After AES + PKCS7: zlib may not start at 0 (extra prefix). Try strict pad, lenient paths,
   * zlib offset scan (0x78, validated), then strict footer (adler-checked — trusted).
   * Note: raw deflate (inflateRaw) is not used; it often false-matches binary noise.
   */
  function decompressSavPayload(unpadded, plainU8) {
    if (looksLikePlaintextYamlBytes(unpadded)) {
      return new TextEncoder().encode(new TextDecoder('utf-8').decode(unpadded));
    }
    var lastErr = null;
    function tryStep(fn, skipPlausibility) {
      try {
        var r = fn();
        if (r == null) return null;
        if (skipPlausibility || isPlausibleBl4YamlBytes(r)) return r;
      } catch (e) {
        lastErr = e;
      }
      return null;
    }
    var yamlBytes = tryStep(
      function () {
        return glacierpieceDecryptBody(plainU8);
      },
      false
    );
    if (yamlBytes) return yamlBytes;
    yamlBytes = null;
    var bi;
    var buf;
    var candidates = collectZlibInputCandidates(unpadded, plainU8);
    for (bi = 0; bi < candidates.length; bi++) {
      buf = candidates[bi];
      yamlBytes = tryStep(
        (function (b) {
          return function () {
            return pako.inflate(b);
          };
        })(buf),
        false
      );
      if (yamlBytes) return yamlBytes;
      yamlBytes = tryStep(
        (function (b) {
          return function () {
            return tryInflateZlibAtScanOffsets(b);
          };
        })(buf),
        false
      );
      if (yamlBytes) return yamlBytes;
    }
    yamlBytes =
      tryStep(function () {
        return inflateZlibToYamlBytes(unpadded, plainU8);
      }, false) ||
      tryStep(function () {
        return zlibDecompressLikePython(pkcs7Unpad(plainU8));
      }, false) ||
      tryStep(function () {
        try {
          return decryptViaStrictFooter(plainU8);
        } catch (e) {
          var m = e && e.message ? String(e.message) : String(e);
          if (/PKCS7|Invalid.*padding|padding bytes/i.test(m)) return null;
          lastErr = lastErr || e;
          return null;
        }
      }, true);
    if (yamlBytes) return yamlBytes;
    throw new Error(
      'Could not decompress save (wrong key or unsupported format). ' +
        (lastErr && lastErr.message ? lastErr.message : '')
    );
  }

  /**
   * Strict path: PKCS7 + 8-byte adler/len footer (matches our encrypt + older toolbox behavior).
   */
  function decryptViaStrictFooter(plainU8) {
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
    return yamlBytes;
  }

  /** Unencrypted YAML (rare); include profile.sav markers so we do not reject as "bad size". */
  function looksLikePlaintextYamlBytes(u8) {
    var probe = new TextDecoder('utf-8', { fatal: false }).decode(u8.slice(0, Math.min(4096, u8.length)));
    return (
      /^\s*%YAML/m.test(probe) ||
      /(^|[\r\n])\s*state\s*:/m.test(probe) ||
      /(^|[\r\n])\s*domains\s*:/m.test(probe) ||
      /(^|[\r\n])\s*profile\s*:/m.test(probe) ||
      /(^|[\r\n])\s*unlockables\s*:/m.test(probe) ||
      /profile_guid\s*:/i.test(probe)
    );
  }

  /**
   * AES ciphertext length must be a multiple of 16 bytes.
   * Try: (1) trimming 0–15 trailing bytes, (2) skipping prefix sk = (L%16)+k*16 up to MAX_PREFIX_SKIP.
   * Covers profile.sav headers and stray suffix bytes without a fixed guess list.
   */
  var MAX_PREFIX_SKIP = 8192;
  var MAX_PREFIX_TRIES = 512;

  function buildAlignedCipherCandidates(raw) {
    var L = raw.length;
    var out = [];
    var seen = Object.create(null);
    function pushSlice(label, bytes) {
      if (!bytes || bytes.length < 16 || bytes.length % 16 !== 0) return;
      var k = bytes.byteOffset + ':' + bytes.byteLength;
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ label: label, bytes: bytes });
    }
    if (L < 16) return out;
    var trim;
    for (trim = 0; trim < 16; trim++) {
      var len = L - trim;
      if (len >= 16 && len % 16 === 0) {
        pushSlice('trimEnd' + trim, raw.subarray(0, len));
      }
    }
    var r = L % 16;
    var sk;
    var tries = 0;
    for (sk = r; sk <= L - 16 && sk <= MAX_PREFIX_SKIP && tries < MAX_PREFIX_TRIES; sk += 16) {
      pushSlice('skip' + sk, sk === 0 ? raw : raw.subarray(sk));
      tries++;
    }
    return out;
  }

  /** One AES-aligned ciphertext slice → UTF-8 YAML string. */
  function decryptAlignedCipherToYaml(cipherBytesU8, keyBytes) {
    var keyWA = uint8ArrayToWordArray(keyBytes);
    var cipherWA = uint8ArrayToWordArray(cipherBytesU8);
    var cp = CryptoJS.lib.CipherParams.create({ ciphertext: cipherWA });
    var plainWA = CryptoJS.AES.decrypt(cp, keyWA, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    var plainU8 = wordArrayToUint8Array(plainWA);
    var unpadded = pkcs7UnpadLenient(plainU8);
    var yamlBytes = decompressSavPayload(unpadded, plainU8);
    return new TextDecoder('utf-8').decode(yamlBytes);
  }

  function decryptSavBytesToYamlWithKey(raw, keyBytes) {
    if (!raw || !raw.length) throw new Error('Empty save file');
    if (looksLikePlaintextYamlBytes(raw)) {
      return new TextDecoder('utf-8').decode(raw);
    }
    var candidates = buildAlignedCipherCandidates(raw);
    if (!candidates.length) {
      throw new Error(
        'Save file size ' + raw.length + ' bytes (length mod 16 = ' + (raw.length % 16) + '). ' +
          'No AES-aligned slice found.'
      );
    }
    var lastErr = null;
    for (var ci = 0; ci < candidates.length; ci++) {
      try {
        return decryptAlignedCipherToYaml(candidates[ci].bytes, keyBytes);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Decryption failed');
  }

  function decryptSavBytesToYaml(cipherBytesU8, steamid) {
    if (!steamid) throw new Error('Account ID required.');
    var digits = normalizeAccountId(steamid);
    if (!digits) throw new Error('Account ID required (SteamID64 decimal or supported hex ID).');
    var candidates = accountBigIntCandidates(digits);
    var lastErr = null;
    for (var ci = 0; ci < candidates.length; ci++) {
      try {
        var keyBytes = deriveKeyFromAccountBigInt(candidates[ci]);
        return decryptSavBytesToYamlWithKey(cipherBytesU8, keyBytes);
      } catch (e) {
        lastErr = e;
      }
    }
    var hint = ' Tried ' + candidates.length + ' key form(s) from your ID.';
    if (lastErr && lastErr.message) {
      throw new Error(lastErr.message + hint);
    }
    throw new Error('Decryption failed.' + hint);
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
    steamId = normalizeAccountId(steamId);
    if (steamInput && steamId) steamInput.value = steamId;
    if (!steamId) {
      steamId = prompt('Enter your account ID (SteamID64 decimal, or supported hex ID) required to decrypt .sav:') || '';
      steamId = normalizeAccountId(steamId);
      if (steamInput) steamInput.value = steamId;
    }
    if (!steamId) return alert('Account ID required to decrypt .sav (SteamID64 decimal, or supported hex ID).');
    var bytes = null;
    try {
      if (typeof window.__stxHideSavDecryptErrorPanel === 'function') window.__stxHideSavDecryptErrorPanel();
      if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.textContent = 'Decrypting and converting .sav to YAML...';
        statusDiv.style.color = '#4caf50';
      }
      bytes = await new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function (e) { resolve(new Uint8Array(e.target.result)); };
        fr.onerror = reject;
        fr.readAsArrayBuffer(saveFile);
      });
      var rawYaml = decryptSavBytesToYaml(bytes, steamId);
      if (typeof window.sanitizeYamlForParse === 'function') rawYaml = window.sanitizeYamlForParse(rawYaml);
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
      var isDecryptError = msg && !/Account ID required|Please select/i.test(msg);
      var fileName = (saveFile && saveFile.name) || '';
      var fileSize = saveFile && typeof saveFile.size === 'number' ? saveFile.size : 0;
      var byteLen = bytes && bytes.length ? bytes.length : fileSize;
      var mod16 = byteLen ? byteLen % 16 : -1;
      var fullDetail =
        'Scooter Toolbox — .sav decrypt error\n' +
        '=====================================\n' +
        'File: ' +
        fileName +
        '\n' +
        'Size: ' +
        byteLen +
        ' bytes (length mod 16 = ' +
        mod16 +
        ')\n' +
        'Account ID used (normalized): ' +
        steamId +
        '\n\n' +
        'Technical message:\n' +
        msg +
        '\n\n' +
        'Hints:\n' +
        '- Character saves and profile.sav use the same AES key (SteamID64 / Epic id).\n' +
        '- Profile.sav may include extra bytes before/after the ciphertext; this build tries many alignments.\n' +
        '- Copy this entire box when asking for help.\n';
      if (typeof window.__stxShowSavDecryptErrorPanel === 'function') {
        window.__stxShowSavDecryptErrorPanel(fullDetail);
      } else {
        console.error(fullDetail);
      }
      if (statusDiv) {
        statusDiv.textContent = isDecryptError
          ? 'Decrypt failed — see the red box below for the full message (Copy button).'
          : 'Error — see the red box below for details.';
        statusDiv.style.color = 'rgba(255,120,100,0.95)';
      }
      alert(
        isDecryptError
          ? 'Decrypt failed. The full error is in the page below (select text or click Copy) — browser alerts cannot be copied.'
          : 'Error: ' + msg
      );
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
      steamid = normalizeAccountId(steamid);
      if (steamInput && steamid) steamInput.value = steamid;
      if (!steamid) {
        steamid = prompt('Enter your account ID (SteamID64 decimal, or supported hex ID) required to encrypt .sav:');
        steamid = normalizeAccountId(steamid);
        if (!steamid) return alert('Account ID required to generate .sav');
        if (steamInput) steamInput.value = steamid;
      }
      if (!steamid) {
        alert('Invalid account ID. Please enter SteamID64 decimal or a supported hex ID.');
        return;
      }
      var yamlTa = document.getElementById('yamlInput') || document.getElementById('fullYamlInput') || document.querySelector('textarea[id*="yaml"]');
      var yamlDataStr = (yamlTa && yamlTa.value ? yamlTa.value : '').trim();
      if (!yamlDataStr) return alert('No YAML found in the editor to convert.');
      if (typeof window.sanitizeYamlForParse === 'function') {
        yamlDataStr = window.sanitizeYamlForParse(yamlDataStr);
        if (yamlTa) yamlTa.value = yamlDataStr;
      }
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

  function hideSavDecryptErrorPanel() {
    var p = document.getElementById('stxSavDecryptErrorPanel');
    var ta = document.getElementById('stxSavDecryptErrorText');
    if (p) p.style.display = 'none';
    if (ta) ta.value = '';
  }

  function showSavDecryptErrorPanel(fullText) {
    var p = document.getElementById('stxSavDecryptErrorPanel');
    var ta = document.getElementById('stxSavDecryptErrorText');
    if (!p || !ta) {
      console.error(fullText);
      return;
    }
    ta.value = fullText;
    p.style.display = 'block';
    try {
      ta.focus();
      ta.select();
    } catch (_) {}
  }

  window.__stxHideSavDecryptErrorPanel = hideSavDecryptErrorPanel;
  window.__stxShowSavDecryptErrorPanel = showSavDecryptErrorPanel;

  function wireSavDecryptErrorCopy() {
    var copyBtn = document.getElementById('stxSavDecryptErrorCopyBtn');
    if (!copyBtn || copyBtn.dataset.stxWired === '1') return;
    copyBtn.dataset.stxWired = '1';
    copyBtn.addEventListener('click', function () {
      var ta = document.getElementById('stxSavDecryptErrorText');
      if (!ta || !ta.value) return;
      var resetLabel = copyBtn.textContent;
      var done = function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () {
          copyBtn.textContent = resetLabel;
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(done).catch(function () {
          try {
            ta.focus();
            ta.select();
            document.execCommand('copy');
            done();
          } catch (_) {}
        });
      } else {
        try {
          ta.focus();
          ta.select();
          document.execCommand('copy');
          done();
        } catch (_) {}
      }
    });
  }

  function onDomReadySavUi() {
    wireSteamIdPersistence();
    wireProfileSavInput();
    wireSavDecryptErrorCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReadySavUi);
  } else {
    onDomReadySavUi();
  }
})();
