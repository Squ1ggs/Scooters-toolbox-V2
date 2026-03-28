/**
 * cc-toolbox-analytics.js — optional server-side visit tracking (PHP api/track.php).
 * Set endpoint before load: window.STX_ANALYTICS_ENDPOINT = 'https://your.host/api/track.php';
 * Or: <meta name="stx-analytics-endpoint" content="https://.../track.php" />
 * Optional: window.STX_ANALYTICS_TRACK_KEY if api/config.php track_secret is set.
 * No-op when endpoint is empty (local file / offline).
 */
(function () {
  var META = 'stx-analytics-endpoint';

  function endpoint() {
    if (typeof window.STX_ANALYTICS_ENDPOINT === 'string' && window.STX_ANALYTICS_ENDPOINT.trim()) {
      return window.STX_ANALYTICS_ENDPOINT.trim();
    }
    var m = document.querySelector('meta[name="' + META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function getOrCreateVisitorId() {
    try {
      var match = document.cookie.match(/(?:^|; )stx_aid=([^;]*)/);
      if (match) return decodeURIComponent(match[1]);
    } catch (_) {}
    var id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 12);
    var maxAge = 365 * 24 * 60 * 60;
    var secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    try {
      document.cookie =
        'stx_aid=' +
        encodeURIComponent(id) +
        '; path=/; max-age=' +
        maxAge +
        '; SameSite=Lax' +
        secure;
    } catch (_) {
      try {
        document.cookie =
          'stx_aid=' + encodeURIComponent(id) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
      } catch (_) {}
    }
    return id;
  }

  function track() {
    var url = endpoint();
    if (!url) return;

    var payload = JSON.stringify({
      visitor_id: getOrCreateVisitorId(),
      path: (typeof location !== 'undefined' ? location.pathname + (location.search || '') : '') || ''
    });

    var headers = { 'Content-Type': 'application/json' };
    if (typeof window.STX_ANALYTICS_TRACK_KEY === 'string' && window.STX_ANALYTICS_TRACK_KEY) {
      headers['X-STX-Track-Key'] = window.STX_ANALYTICS_TRACK_KEY;
    }

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: payload,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store'
    })
      .then(function (r) {
        return r.json().catch(function () {
          return {};
        });
      })
      .then(function (j) {
        try {
          window.STX_ANALYTICS_LAST = j;
          window.dispatchEvent(new CustomEvent('stx-analytics', { detail: j }));
        } catch (_) {}
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', track);
  } else {
    track();
  }
})();
