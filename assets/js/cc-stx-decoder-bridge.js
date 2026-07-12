/**
 * cc-stx-decoder-bridge.js
 * Decodes serials via same-page WASM when window.STX_DECODER_USE_INLINE + __stxDecodeSerialsBatch (bulk serial validator),
 * otherwise loads legacy/bl4-bulk-decoder.html in a hidden iframe and uses postMessage.
 * On file://, iframes are skipped (unique origins) — waits for inline WASM instead.
 */
(function () {
  'use strict';

  /** Toolbox root uses ./legacy/…; legacy/legit-builder.html sets window.STX_DECODER_IFRAME_URL to same-folder deserializer. */
  var DECODER_URL = (typeof window !== 'undefined' && window.STX_DECODER_IFRAME_URL) ? window.STX_DECODER_IFRAME_URL : './legacy/bl4-bulk-decoder.html';
  var iframe = null;
  var ready = false;
  var pending = Object.create(null);
  var nextId = 0;

  function isFileProtocol() {
    if (typeof window.stxIsFileProtocol === 'function') return window.stxIsFileProtocol();
    try {
      return location.protocol === 'file:';
    } catch (_) {
      return false;
    }
  }

  function preferInlineDecoder() {
    if (typeof window.STX_DECODER_USE_INLINE === 'boolean' && window.STX_DECODER_USE_INLINE === true) return true;
    return isFileProtocol();
  }

  function useInlineDecode() {
    return (
      preferInlineDecoder() &&
      typeof window.__stxDecodeSerialsBatch === 'function' &&
      (typeof window.initDecoder === 'function' || (window.stxDecodeBulk && window.stxDecoderReady))
    );
  }

  function shouldAvoidDecoderIframe() {
    return preferInlineDecoder() || isFileProtocol();
  }

  function getIframe() {
    if (shouldAvoidDecoderIframe()) return null;
    if (iframe && iframe.parentNode) return iframe;
    try {
      iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
      iframe.src = DECODER_URL;
      iframe.title = 'STX serial decoder';
      document.body.appendChild(iframe);
    } catch (e) {
      console.warn('STX decoder bridge: could not create iframe', e);
    }
    return iframe;
  }

  function waitForInlineDecode(serials, callback, options, maxAttempts) {
    maxAttempts = maxAttempts == null ? 80 : maxAttempts;
    var attempts = 0;
    return new Promise(function (resolve) {
      function retry() {
        if (useInlineDecode()) {
          return window.__stxDecodeSerialsBatch(serials, options).then(function (results) {
            if (typeof callback === 'function') callback(results);
            resolve(results);
          }).catch(function (err) {
            if (!window.__stxInlineDecodeWarned) {
              window.__stxInlineDecodeWarned = true;
              console.warn('STX inline decode failed:', err && err.message ? err.message : err);
            }
            if (typeof callback === 'function') callback([]);
            resolve([]);
          });
        }
        if (attempts++ < maxAttempts) {
          setTimeout(retry, 150);
          return;
        }
        if (typeof callback === 'function') callback([]);
        resolve([]);
      }
      retry();
    });
  }

  window.addEventListener('message', function (ev) {
    if (shouldAvoidDecoderIframe()) return;
    var d = ev.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'stx-decoder-ready') {
      ready = true;
      return;
    }
    if (d.type === 'stx-decoder-init-error') {
      console.warn('STX decoder iframe failed to init:', d.message || d);
      ready = false;
      return;
    }
    if (d.type === 'stx-decode-response' && d.id != null && pending[d.id]) {
      var cb = pending[d.id];
      delete pending[d.id];
      try { cb(d.error ? [] : (d.results || [])); } catch (_) {}
    }
  });

  /**
   * @param {string[]} serials
   * @param {function} [callback]
   * @param {{ enrichResolved?: boolean }} [options] — when true, WASM path runs PARTS_DB resolution (resolvedParts) for Legit Builder decode path
   */
  window.decodeSerialsViaBridge = function (serials, callback, options) {
    options = options || {};
    if (!Array.isArray(serials) || serials.length === 0) {
      if (typeof callback === 'function') callback([]);
      return Promise.resolve([]);
    }
    if (useInlineDecode()) {
      ready = true;
      return window.__stxDecodeSerialsBatch(serials, options).then(function (results) {
        if (typeof callback === 'function') callback(results);
        return results;
      }).catch(function (err) {
        if (!window.__stxInlineDecodeWarned) {
          window.__stxInlineDecodeWarned = true;
          console.warn('STX inline decode failed:', err && err.message ? err.message : err);
        }
        if (typeof callback === 'function') callback([]);
        return [];
      });
    }
    if (shouldAvoidDecoderIframe()) {
      return waitForInlineDecode(serials, callback, options);
    }
    var f = getIframe();
    if (!f || !f.contentWindow) {
      if (typeof callback === 'function') callback([]);
      return Promise.resolve([]);
    }
    function postWhenReady() {
      var id = 'stx-' + (++nextId);
      return new Promise(function (resolve) {
        pending[id] = function (results) {
          resolve(results);
          if (typeof callback === 'function') callback(results);
        };
        try {
          f.contentWindow.postMessage({
            type: 'stx-decode-request',
            id: id,
            serials: serials,
            enrichResolved: !!options.enrichResolved
          }, '*');
        } catch (e) {
          delete pending[id];
          resolve([]);
        }
        setTimeout(function () {
          if (pending[id]) {
            delete pending[id];
            resolve([]);
          }
        }, 15000);
      });
    }
    if (ready) return postWhenReady();
    /* Wait for stx-decoder-ready before the first postMessage. */
    return new Promise(function (resolve) {
      var tries = 0;
      function tick() {
        if (ready || tries >= 60) {
          postWhenReady().then(resolve);
          return;
        }
        tries++;
        setTimeout(tick, 50);
      }
      tick();
    });
  };

  window.stxDecoderBridgeReady = function () {
    if (useInlineDecode()) return true;
    if (shouldAvoidDecoderIframe()) return false;
    return ready;
  };

  window.initStxDecoderBridge = function () {
    if (preferInlineDecoder()) {
      if (typeof window.initDecoder === 'function') {
        try { window.initDecoder(); } catch (_) {}
      }
      return;
    }
    /* Warm the iframe early so Convert does not race the first decode. */
    getIframe();
  };

  /**
   * Decode one @U / game serial to desktop text via the WASM bridge (canonical).
   * Local JS deserialize is only a last-resort fallback, and is rejected when it
   * fails a pack round-trip (it silently truncates many real serials).
   * @param {string} serial
   * @returns {Promise<string>}
   */
  window.ccDecodeSerialToDesktop = function (serial) {
    var s = String(serial || '').trim();
    if (!s) return Promise.resolve('');

    function localDecode() {
      if (typeof window.deserializeBase85 !== 'function') return '';
      try {
        var d = window.deserializeBase85(s);
        return (d && String(d).trim()) || '';
      } catch (_) {
        return '';
      }
    }

    function packDeser(deser) {
      var d = String(deser || '').trim();
      if (!d) return '';
      try {
        if (typeof window.__stxNicnlPackDeserialized === 'function') {
          var pk = String(window.__stxNicnlPackDeserialized(d) || '').trim();
          if (pk) return pk.indexOf('@U') === 0 ? pk : ('@U' + pk.replace(/^@U/i, ''));
        }
      } catch (_) {}
      try {
        if (typeof window.serializeToBase85 === 'function') {
          var b = String(window.serializeToBase85(d, undefined, false) || '').trim();
          if (b) return b.indexOf('@U') === 0 ? b : ('@U' + b.replace(/^@U/i, ''));
        }
      } catch (_) {}
      return '';
    }

    function normalizeU(u) {
      u = String(u || '').trim();
      if (!u) return '';
      return u.indexOf('@U') === 0 ? u : ('@U' + u.replace(/^@U/i, ''));
    }

    /** Local bitstream decode often drops trailing parts — refuse those results. */
    function localDecodeIfFaithful() {
      var d = localDecode();
      if (!d) return '';
      if (!/^@U/i.test(s)) return d;
      var packed = packDeser(d);
      if (!packed) return '';
      var orig = normalizeU(s);
      var got = normalizeU(packed);
      if (got === orig) return d;
      /* Encoding can differ slightly; large shrink means truncated decode. */
      if (got.length + 4 < orig.length) return '';
      if (Math.abs(got.length - orig.length) > 8) return '';
      return d;
    }

    function fallbackLocal() {
      return localDecodeIfFaithful() || '';
    }

    try { window.initStxDecoderBridge(); } catch (_) {}

    if (typeof window.decodeSerialsViaBridge !== 'function') {
      return Promise.resolve(fallbackLocal());
    }

    return new Promise(function (resolve) {
      var attempts = 0;
      var maxAttempts = 40; /* ~2s at 50ms — accuracy over instant local */
      function run() {
        var ready = typeof window.stxDecoderBridgeReady !== 'function' || window.stxDecoderBridgeReady();
        if (!ready && attempts < maxAttempts) {
          attempts++;
          setTimeout(run, 50);
          return;
        }
        window.decodeSerialsViaBridge([s], null, { enrichResolved: false }).then(function (results) {
          var r = results && results[0];
          if (r && r.success && r.deserialized && String(r.deserialized).trim()) {
            resolve(String(r.deserialized).trim());
            return;
          }
          resolve(fallbackLocal());
        }).catch(function () {
          resolve(fallbackLocal());
        });
      }
      run();
    });
  };

  /* Prefetch decoder so the first Convert is less likely to hit the wait loop. */
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        try { window.initStxDecoderBridge(); } catch (_) {}
      });
    } else {
      setTimeout(function () {
        try { window.initStxDecoderBridge(); } catch (_) {}
      }, 0);
    }
  } catch (_) {}
})();
