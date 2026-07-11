/**
 * Canonical BL-base85 serialization via the same Nicnl-compatible API used by BL4 save editors
 * NICNL serialize API — POST { deserialized } → { serial_b85 } (hosted endpoint in meta / below).
 * Falls back to window.serializeToBase85 when offline, CORS-blocked, or API errors.
 */
(function () {
  'use strict';

  var SERIALIZE_URL = 'https://save-editor.be/nicnl/api.php';

  /**
   * @param {string} deserialized
   * @returns {Promise<string>} @U serial or ''
   */
  function ccSerializeDeserializedRemote(deserialized, opts) {
    var d = String(deserialized || '').trim();
    if (!d) return Promise.resolve('');
    if (/^@U/i.test(d)) {
      var u = d.indexOf('@U') === 0 ? d : ('@U' + d.replace(/^@U/i, ''));
      if (u.length >= 10 && u.indexOf(',') < 0 && u.indexOf('||') < 0) return Promise.resolve(u);
    }
    if (window.STX_DESKTOP && window.STX_DESKTOP.disableRemoteSerialization) {
      return Promise.resolve('');
    }
    var timeoutMs = (opts && opts.timeoutMs != null) ? Number(opts.timeoutMs) : 900;
    if (!(timeoutMs > 0)) timeoutMs = 900;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = 0;
    if (ctrl) {
      timer = setTimeout(function () {
        try { ctrl.abort(); } catch (_) {}
      }, timeoutMs);
    }
    var fetchOpts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deserialized: d }),
    };
    if (ctrl) fetchOpts.signal = ctrl.signal;
    return fetch(SERIALIZE_URL, fetchOpts)
      .then(function (r) {
        if (!r.ok) throw new Error('serialize HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        var s = j && (j.serial_b85 != null ? j.serial_b85 : j.serial);
        s = s && String(s).trim();
        return s || '';
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  window.ccSerializeDeserializedRemote = ccSerializeDeserializedRemote;
})();
