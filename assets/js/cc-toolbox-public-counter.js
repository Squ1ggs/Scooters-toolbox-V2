(function () {
  var META = 'stx-counter-url';
  var KEY_META = 'stx-counter-key';

  function counterPublicKey() {
    if (typeof window.STX_COUNTER_PUBLIC_KEY === 'string' && window.STX_COUNTER_PUBLIC_KEY) {
      return String(window.STX_COUNTER_PUBLIC_KEY).trim();
    }
    var m = document.querySelector('meta[name="' + KEY_META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function configuredUrl() {
    if (typeof window.STX_COUNTER_URL === 'string' && window.STX_COUNTER_URL.trim()) {
      return window.STX_COUNTER_URL.trim();
    }
    var m = document.querySelector('meta[name="' + META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function configuredPhpUrl() {
    var m = document.querySelector('meta[name="stx-php-counter-url"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function shouldPreferConfiguredCounter() {
    try {
      var h = String(location.hostname || '').toLowerCase();
      return h === 'scooters-toolbox.netlify.app' || h === 'localhost' || h === '127.0.0.1';
    } catch (_) {
      return false;
    }
  }

  /** Project Pages live under *.github.io; same-origin counter_v2.php does not exist — only absolute metas work. */
  function isGitHubPagesHost() {
    try {
      var h = String(location.hostname || '').toLowerCase();
      return h === 'github.io' || h.slice(-10) === '.github.io';
    } catch (_) {
      return false;
    }
  }

  function candidateUrls(filename) {
    var out = [];
    var seen = Object.create(null);
    function add(u) {
      if (!u) return;
      if (seen[u]) return;
      seen[u] = true;
      out.push(u);
    }

    var cfg = configuredUrl();
    var php = configuredPhpUrl();
    var isHttp = typeof location !== 'undefined' && /^https?:$/i.test(location.protocol || '');
    var preferCfg = shouldPreferConfiguredCounter();

    /* Prefer meta / STX_COUNTER_URL (Netlify functions) first — legacy counter.php probes can return 200 with
       stale JSON and block the real endpoint (fetchJsonFirst stops on first success). */
    if (isHttp) {
      if (isGitHubPagesHost()) {
        /* Absolute API URLs from patch-index-for-github-pages must run before resolving counter_v2.php
           against the Pages origin (404). */
        if (cfg && /^https?:\/\//i.test(cfg)) add(cfg);
        if (php) {
          try { add(new URL(php, location.href).href); } catch (_) { add(php); }
        }
        if (cfg && !/^https?:\/\//i.test(cfg)) add(cfg);
        return out;
      }
      if (preferCfg && cfg) add(cfg);
      if (php) {
        try { add(new URL(php, location.href).href); } catch (_) { add(php); }
      }
      try { add(new URL(filename, location.href).href); } catch (_) {}
      try { add(new URL('../' + filename, location.href).href); } catch (_) {}
      try { add(new URL('../../' + filename, location.href).href); } catch (_) {}
      if (!preferCfg && cfg) add(cfg);
    } else if (cfg) {
      add(cfg);
    }

    return out;
  }

  function formatNum(n) {
    var x = Number(n);
    if (!Number.isFinite(x)) return '—';
    try {
      return new Intl.NumberFormat().format(x);
    } catch (_) {
      return String(Math.round(x));
    }
  }

  function loadLocalCrafted() {
    try {
      if (window.STX_ITEMS_MADE && typeof window.STX_ITEMS_MADE.getStats === 'function') {
        var d = window.STX_ITEMS_MADE.getStats();
        return {
          total: Math.max(0, Number(d.total) || 0),
          simple: Math.max(0, Number(d.simple) || 0),
          guided: Math.max(0, Number(d.guided) || 0),
          legit: Math.max(0, Number(d.legit) || 0)
        };
      }
    } catch (_) {}
    try {
      var raw = localStorage.getItem('stx_toolbox_items_made_v1');
      if (!raw) return { total: 0, simple: 0, guided: 0, legit: 0 };
      var o = JSON.parse(raw);
      return {
        total: Math.max(0, Number(o.total) || 0),
        simple: Math.max(0, Number(o.simple) || 0),
        guided: Math.max(0, Number(o.guided) || 0),
        legit: Math.max(0, Number(o.legit) || 0)
      };
    } catch (_) {
      return { total: 0, simple: 0, guided: 0, legit: 0 };
    }
  }

  function refreshLocal() {
    var d = loadLocalCrafted();
    var elT = document.getElementById('stx-counter-local-total');
    var elB = document.getElementById('stx-counter-local-breakdown');
    if (elT) elT.textContent = formatNum(d.total);
    if (elB) {
      elB.textContent =
        'Simple ' + formatNum(d.simple) + ' · Guided ' + formatNum(d.guided) + ' · Legit ' + formatNum(d.legit);
    }
  }

  function setServerItemsFromData(data) {
    var itemsEl = document.getElementById('stx-counter-server-items');
    if (!itemsEl) return;
    var im = data && data.items_made != null ? Number(data.items_made) : NaN;
    itemsEl.textContent = Number.isFinite(im) ? formatNum(im) : '—';
  }

  function yourVisitsEl() {
    return document.getElementById('stx-counter-your-visits');
  }

  /** Netlify track returns `your_visits`; shared PHP track.php now matches. */
  function applyYourVisitsFromAnalytics() {
    var el = yourVisitsEl();
    if (!el) return;
    var j =
      typeof window.STX_ANALYTICS_LAST === 'object' && window.STX_ANALYTICS_LAST
        ? window.STX_ANALYTICS_LAST
        : null;
    var yv = j && j.your_visits != null ? Number(j.your_visits) : NaN;
    el.textContent = Number.isFinite(yv) ? formatNum(yv) : '—';
  }

  /** Netlify-style read-only counter: ?read=1 avoids incrementing on every stats open. Key in query avoids CORS preflight for custom headers. */
  function counterDisplayUrl(baseUrl) {
    var k = counterPublicKey();
    try {
      var u = new URL(baseUrl, typeof location !== 'undefined' ? location.href : undefined);
      u.searchParams.set('read', '1');
      if (k) u.searchParams.set('key', k);
      return u.href;
    } catch (_) {
      var sep = baseUrl.indexOf('?') === -1 ? '?' : '&';
      var q = 'read=1' + (k ? '&key=' + encodeURIComponent(k) : '');
      return baseUrl + sep + q;
    }
  }

  function fetchJsonFirst(urls) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error('no_counter_endpoint'));
      var url = counterDisplayUrl(urls[i++]);
      return fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      })
        .then(function (r) {
          if (!r.ok) throw new Error('http_' + r.status);
          return r.json();
        })
        .catch(function () {
          return next();
        });
    }
    return next();
  }

  function fetchServer() {
    var urls = candidateUrls('counter.php');
    var totalEl = document.getElementById('stx-counter-server-total');
    var uniqueEl = document.getElementById('stx-counter-server-unique');
    var itemsEl = document.getElementById('stx-counter-server-items');
    var hintEl = document.getElementById('stx-counter-server-hint');
    if (!urls.length) {
      if (totalEl) totalEl.textContent = '—';
      if (uniqueEl) uniqueEl.textContent = '—';
      if (itemsEl) itemsEl.textContent = '—';
      var yEl0 = yourVisitsEl();
      if (yEl0) yEl0.textContent = '—';
      if (hintEl) hintEl.style.display = 'none';
      return;
    }
    if (hintEl) hintEl.style.display = 'none';
    if (totalEl) totalEl.textContent = '…';
    if (uniqueEl) uniqueEl.textContent = '…';
    if (itemsEl) itemsEl.textContent = '…';

    fetchJsonFirst(urls)
      .then(function (data) {
        var t = data && data.total != null ? Number(data.total) : NaN;
        var u = data && data.unique != null ? Number(data.unique) : NaN;
        if (Number.isFinite(t) && Number.isFinite(u)) {
          if (totalEl) totalEl.textContent = formatNum(t);
          if (uniqueEl) uniqueEl.textContent = formatNum(u);
        } else {
          if (totalEl) totalEl.textContent = '—';
          if (uniqueEl) uniqueEl.textContent = '—';
        }
        setServerItemsFromData(data);
      })
      .catch(function () {
        if (totalEl) totalEl.textContent = '—';
        if (uniqueEl) uniqueEl.textContent = '—';
        if (itemsEl) itemsEl.textContent = '—';
        var yEl1 = yourVisitsEl();
        if (yEl1) yEl1.textContent = '—';
      });
  }

  function refreshAll() {
    refreshLocal();
    applyYourVisitsFromAnalytics();
    fetchServer();
  }

  function init() {
    var menu = document.getElementById('stxPublicCounterMenu');
    if (!menu) return;
    menu.addEventListener('toggle', function () {
      if (!menu.open) return;
      refreshAll();
    });
    try {
      window.addEventListener('storage', function (ev) {
        if (ev.key === 'stx_toolbox_items_made_v1' && menu.open) refreshLocal();
      });
    } catch (_) {}
    document.addEventListener('stx-items-made-bump', function () {
      if (menu.open) refreshLocal();
    });
    document.addEventListener('stx-server-items-made', function (ev) {
      var n = ev && ev.detail != null ? Number(ev.detail) : NaN;
      var itemsEl = document.getElementById('stx-counter-server-items');
      if (itemsEl && Number.isFinite(n)) itemsEl.textContent = formatNum(n);
    });
    document.addEventListener('stx-analytics', function () {
      applyYourVisitsFromAnalytics();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
