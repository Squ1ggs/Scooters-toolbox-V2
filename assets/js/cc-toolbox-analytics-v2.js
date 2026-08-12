(function () {
  var META = 'stx-analytics-endpoint';

  function configuredEndpoint() {
    if (typeof window.STX_ANALYTICS_ENDPOINT === 'string' && window.STX_ANALYTICS_ENDPOINT.trim()) {
      return window.STX_ANALYTICS_ENDPOINT.trim();
    }
    var m = document.querySelector('meta[name="' + META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  /** file://, iframe sandbox, etc. — remote Netlify has no CORS for Origin "null"; skip to avoid console noise. */
  function allowRemoteAnalyticsEndpoints() {
    if (typeof location === 'undefined') return false;
    if (!/^https?:$/i.test(location.protocol || '')) return false;
    try {
      var o = String(location.origin || '');
      if (o === 'null' || o === 'file://') return false;
    } catch (_) {
      return false;
    }
    try {
      var h = String(location.hostname || '').toLowerCase();
      if (h === 'scooters-toolbox.netlify.app') return true;
      /* GitHub Pages mirror: allow POST when meta points at a real HTTPS API (patch sets save-editor track.php). */
      if (h === 'github.io' || h.slice(-10) === '.github.io') {
        var ep = configuredEndpoint();
        if (ep && /^https:\/\//i.test(ep)) return true;
      }
      /* Other shared-host / mirrors: disable remote analytics POST to avoid 403/404 spam. */
      return false;
    } catch (_) {
      return false;
    }
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
    var isHttp = allowRemoteAnalyticsEndpoints();

    /* Prefer meta / STX_ANALYTICS_ENDPOINT (e.g. Netlify track) before same-origin track.php — avoids stale hits. */
    if (!cfg) return out;
    add(cfg);
    return out;

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

  function postWithBodyFirst(urls, headers, body) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error('no_analytics_endpoint'));
      var url = urls[i++];
      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
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
    if (!allowRemoteAnalyticsEndpoints()) return;
    var urls = candidateEndpoints('track.php');
    if (!urls.length) return;

    var trackKey = '';
    if (typeof window.STX_ANALYTICS_TRACK_KEY === 'string' && window.STX_ANALYTICS_TRACK_KEY) {
      trackKey = String(window.STX_ANALYTICS_TRACK_KEY).trim();
    } else {
      try {
        var mk = document.querySelector('meta[name="stx-analytics-track-key"]');
        if (mk && mk.content) trackKey = String(mk.content).trim();
      } catch (_) {}
    }
    var visitorId = getOrCreateVisitorId();
    var pagePath =
      (typeof location !== 'undefined' ? location.pathname + (location.search || '') : '') || '';

    /* Netlify functions expect JSON + X-STX-Track-Key; their CORS allows it. Shared PHP behind nginx: form body (no preflight). */
    var ep0 = urls[0] || '';
    var isNetlifyFn = false;
    try {
      var tu = new URL(ep0, typeof location !== 'undefined' ? location.href : 'https://local.invalid/');
      var th = String(tu.hostname || '').toLowerCase();
      isNetlifyFn = th === 'netlify.app' || th.slice(-12) === '.netlify.app';
    } catch (_) {
      isNetlifyFn = false;
    }

    var chain;
    if (isNetlifyFn) {
      var payload = JSON.stringify({
        visitor_id: visitorId,
        path: pagePath
      });
      var hdrs = { 'Content-Type': 'application/json' };
      if (trackKey) hdrs['X-STX-Track-Key'] = trackKey;
      chain = postWithBodyFirst(urls, hdrs, payload);
    } else {
      var params = new URLSearchParams();
      params.set('visitor_id', visitorId);
      params.set('path', pagePath);
      if (trackKey) params.set('track_key', trackKey);
      chain = postWithBodyFirst(urls, { 'Content-Type': 'application/x-www-form-urlencoded' }, params.toString());
    }

    chain
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
