/**
 * cc-stx-decoder-bridge.js
 * Decodes serials via same-page WASM when window.STX_DECODER_USE_INLINE + __stxDecodeSerialsBatch (bulk serial validator),
 * otherwise loads legacy/bl4-bulk-decoder.html in a hidden iframe and uses postMessage.
 */
(function () {
  'use strict';

  /** Toolbox root uses ./legacy/…; legacy/legit-builder.html sets window.STX_DECODER_IFRAME_URL to same-folder deserializer. */
  var DECODER_URL = (typeof window !== 'undefined' && window.STX_DECODER_IFRAME_URL) ? window.STX_DECODER_IFRAME_URL : './legacy/bl4-bulk-decoder.html';
  var iframe = null;
  var ready = false;
  var pending = Object.create(null);
  var nextId = 0;

  function useInlineDecode() {
    return typeof window.STX_DECODER_USE_INLINE === 'boolean' && window.STX_DECODER_USE_INLINE === true
      && typeof window.__stxDecodeSerialsBatch === 'function';
  }

  function getIframe() {
    if (useInlineDecode()) return null;
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

  window.addEventListener('message', function (ev) {
    if (useInlineDecode()) return;
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
        console.warn('STX inline decode failed:', err);
        if (typeof callback === 'function') callback([]);
        return [];
      });
    }
    var f = getIframe();
    if (!f || !f.contentWindow) {
      if (typeof callback === 'function') callback([]);
      return Promise.resolve([]);
    }
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
  };

  window.stxDecoderBridgeReady = function () {
    if (useInlineDecode()) return true;
    return ready;
  };

  window.initStxDecoderBridge = function () {
    if (useInlineDecode()) {
      if (typeof window.initDecoder === 'function') {
        try { window.initDecoder(); } catch (_) {}
      }
      return;
    }
    getIframe();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initStxDecoderBridge(); }, { once: true });
  } else {
    initStxDecoderBridge();
  }
})();
