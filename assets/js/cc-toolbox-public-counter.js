/**
 * cc-toolbox-public-counter.js — header "Stats" menu: server totals + local items-crafted.
 * Server: set <meta name="stx-counter-url" content="https://host/api/counter.php?key=…"/> or
 * window.STX_COUNTER_URL before this script. JSON: { total, unique, items_made? }.
 * See api/counter.php and api/SETUP.md.
 */
(function () {
  var META = 'stx-counter-url';

  function counterUrl() {
    if (typeof window.STX_COUNTER_URL === 'string' && window.STX_COUNTER_URL.trim()) {
      return window.STX_COUNTER_URL.trim();
    }
    var m = document.querySelector('meta[name="' + META + '"]');
    return m && m.content ? String(m.content).trim() : '';
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

  function fetchServer() {
    var url = counterUrl();
    var totalEl = document.getElementById('stx-counter-server-total');
    var uniqueEl = document.getElementById('stx-counter-server-unique');
    var itemsEl = document.getElementById('stx-counter-server-items');
    var hintEl = document.getElementById('stx-counter-server-hint');
    if (!url) {
      if (totalEl) totalEl.textContent = '—';
      if (uniqueEl) uniqueEl.textContent = '—';
      if (itemsEl) itemsEl.textContent = '—';
      if (hintEl) hintEl.style.display = 'block';
      return;
    }
    if (hintEl) hintEl.style.display = 'none';
    if (totalEl) totalEl.textContent = '…';
    if (uniqueEl) uniqueEl.textContent = '…';
    if (itemsEl) itemsEl.textContent = '…';
    fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store' })
      .then(function (r) {
        return r.json().catch(function () {
          return {};
        });
      })
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
      });
  }

  function refreshAll() {
    refreshLocal();
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
