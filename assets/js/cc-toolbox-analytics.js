/**
 * cc-toolbox-analytics.js — optional server-side visit tracking.
 * Supports configured endpoints (meta/window) and local PHP fallbacks such as track.php
 * on the current page path / parent paths when hosted on a PHP server.
 */
(function () {
  var META = 'stx-analytics-endpoint';

  function configuredEndpoint() {
    if (typeof window.STX_ANALYTICS_ENDPOINT === 'string' && window.STX_ANALYTICS_ENDPOINT.trim()) {
      return window.STX_ANALYTICS_ENDPOINT.trim();
    }
    var m = document.querySelector('meta[name="' + META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function candidateEndpoints(filename) {
    var out = [];
    var seen = Object.create(null);
    function add(u) {
      if (!u) return;
      if (seen[u]) return;
      seen[u] = true;
      out.push(u);
    }

    var cfg = configuredEndpoint();
    var isHttp = typeof location !== 'undefined' && /^https?:$/i.test(location.protocol || '');

    if (isHttp) {
      try { add(new URL(filename, location.href).href); } catch (_) {}
      try { add(new URL('../' + filename, location.href).href); } catch (_) {}
      try { add(new URL('../../' + filename, location.href).href); } catch (_) {}
    }

    add(cfg);
    return out;
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

  function postJsonFirst(urls, payload, headers) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error('no_analytics_endpoint'));
      var url = urls[i++];
      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      })
        .then(function (r) {
          if (!r.ok) throw new Error('http_' + r.status);
          return r.json().catch(function () { return {}; });
        })
        .catch(function () {
          return next();
        });
    }
    return next();
  }

  function track() {
    var urls = candidateEndpoints('track.php');
    if (!urls.length) return;

    var payload = JSON.stringify({
      visitor_id: getOrCreateVisitorId(),
      path: (typeof location !== 'undefined' ? location.pathname + (location.search || '') : '') || ''
    });

    var headers = { 'Content-Type': 'application/json' };
    if (typeof window.STX_ANALYTICS_TRACK_KEY === 'string' && window.STX_ANALYTICS_TRACK_KEY) {
      headers['X-STX-Track-Key'] = window.STX_ANALYTICS_TRACK_KEY;
    }

    postJsonFirst(urls, payload, headers)
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
