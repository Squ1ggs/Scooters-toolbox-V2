/**
 * Canonical BL-base85 serialization via the same Nicnl-compatible API used by BL4 save editors
 * (reference: save-editor.be/nicnl/api.php — POST { deserialized } → { serial_b85 }).
 * Falls back to window.serializeToBase85 when offline, CORS-blocked, or API errors.
 */
(function () {
  'use strict';

  var SERIALIZE_URL = 'https://save-editor.be/nicnl/api.php';

  /**
   * @param {string} deserialized
   * @returns {Promise<string>} @U serial or ''
   */
  function ccSerializeDeserializedRemote(deserialized) {
    var d = String(deserialized || '').trim();
    if (!d) return Promise.resolve('');
    if (/^@U/i.test(d)) {
      var u = d.indexOf('@U') === 0 ? d : ('@U' + d.replace(/^@U/i, ''));
      if (u.length >= 10 && u.indexOf(',') < 0 && u.indexOf('||') < 0) return Promise.resolve(u);
    }
    return fetch(SERIALIZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deserialized: d }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('serialize HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        var s = j && (j.serial_b85 != null ? j.serial_b85 : j.serial);
        s = s && String(s).trim();
        return s || '';
      });
  }

  window.ccSerializeDeserializedRemote = ccSerializeDeserializedRemote;
})();
