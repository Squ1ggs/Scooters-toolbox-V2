(function () {
  var STORAGE_KEY = 'stx_toolbox_items_made_v1';
  var BADGE_KEY = 'stx_items_made_show_badge';
  var COOLDOWN_MS = 480;
  var BUMP_URL_META = 'stx-items-bump-url';
  var BUMP_KEY_META = 'stx-items-bump-key';

  var lastBump = 0;
  /** One local/server bump per "build" until topology changes; avoids counting every part add. */
  var craftSessionCounted = false;

  function configuredItemsBumpUrl() {
    if (typeof window.STX_ITEMS_BUMP_URL === 'string' && window.STX_ITEMS_BUMP_URL.trim()) {
      return window.STX_ITEMS_BUMP_URL.trim();
    }
    var m = document.querySelector('meta[name="' + BUMP_URL_META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function itemsBumpUrls() {
    var out = [];
    var seen = Object.create(null);
    function add(u) {
      if (!u) return;
      if (seen[u]) return;
      seen[u] = true;
      out.push(u);
    }
    var isHttp = typeof location !== 'undefined' && /^https?:$/i.test(location.protocol || '');
    var cfg = configuredItemsBumpUrl();
    /* Prefer configured Netlify endpoint first; a same-origin legacy items-bump.php can return 200
       and prevent fallback, which keeps world counter lower than real usage. */
    if (cfg) add(cfg);
    if (isHttp) {
      try { add(new URL('items-bump.php', location.href).href); } catch (_) {}
      try { add(new URL('../items-bump.php', location.href).href); } catch (_) {}
      try { add(new URL('../../items-bump.php', location.href).href); } catch (_) {}
    }
    return out;
  }

  function itemsBumpKey() {
    if (typeof window.STX_ITEMS_BUMP_KEY === 'string' && window.STX_ITEMS_BUMP_KEY) {
      return String(window.STX_ITEMS_BUMP_KEY).trim();
    }
    var m = document.querySelector('meta[name="' + BUMP_KEY_META + '"]');
    return m && m.content ? String(m.content).trim() : '';
  }

  function reportGlobalItemsBump() {
    var urls = itemsBumpUrls();
    if (!urls.length) return;
    var k = itemsBumpKey();
    var cfg = configuredItemsBumpUrl();
    var isNetlifyFn = false;
    try {
      var iu = new URL(cfg, typeof location !== 'undefined' ? location.href : 'https://local.invalid/');
      var ih = String(iu.hostname || '').toLowerCase();
      isNetlifyFn = ih === 'netlify.app' || ih.slice(-12) === '.netlify.app';
    } catch (_) {
      isNetlifyFn = false;
    }
    var headers;
    var body;
    if (isNetlifyFn) {
      headers = { 'Content-Type': 'application/json' };
      if (k) headers['X-STX-Items-Bump-Key'] = k;
      body = JSON.stringify({ delta: 1 });
    } else {
      var params = new URLSearchParams();
      params.set('delta', '1');
      if (k) params.set('items_bump_key', k);
      headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      body = params.toString();
    }

    (function postNext(i) {
      if (i >= urls.length) return;
      fetch(urls[i], {
        method: 'POST',
        headers: headers,
        body: body,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      })
        .then(function (r) {
          if (!r.ok) throw new Error('http_' + r.status);
          return r.json().catch(function () {
            return null;
          });
        })
        .then(function (j) {
          if (j && j.ok && typeof j.items_made === 'number') {
            try {
              document.dispatchEvent(new CustomEvent('stx-server-items-made', { detail: j.items_made }));
            } catch (_) {}
          }
        })
        .catch(function () {
          postNext(i + 1);
        });
    })(0);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
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

  function save(d) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch (_) {}
  }

  function mainSerialLooksComplete() {
    var a = byId('guidedOutputSerial');
    var b = byId('outCode');
    var s = (a && a.value && String(a.value).trim()) || (b && b.value && String(b.value).trim()) || '';
    if (s.length < 12) return false;
    if (s === 'â€”' || s === '—' || /^[—\-–]+$/.test(s)) return false;
    if (s.indexOf('@U') === 0) return true;
    if (s.indexOf('||') >= 0 && s.indexOf('{') >= 0) return true;
    if (/\{\d+:\d+\}/.test(s)) return true;
    var compact = s.replace(/\s/g, '');
    if (compact.length >= 18 && /^[A-Za-z0-9+/=@]+$/.test(compact)) return true;
    return false;
  }

  function maybeBumpFirstCompleteThisSession() {
    if (craftSessionCounted) return;
    if (!mainSerialLooksComplete()) return;
    craftSessionCounted = true;
    bump(isGuidedContext() ? 'guided' : 'simple');
  }

  function isGuidedContext() {
    var g = byId('ccGuidedItemType');
    return !!(g && String(g.value || '').trim());
  }

  function bump(source) {
    var now = Date.now();
    if (now - lastBump < COOLDOWN_MS) return;
    lastBump = now;
    var d = load();
    if (source === 'simple') d.simple += 1;
    else if (source === 'guided') d.guided += 1;
    else if (source === 'legit') d.legit += 1;
    else return;
    d.total += 1;
    save(d);
    updateBadge();
    refreshPanelIfOpen();
    try {
      document.dispatchEvent(new CustomEvent('stx-items-made-bump', { detail: d }));
    } catch (_) {}
    reportGlobalItemsBump();
  }

  var MAIN_TOPOLOGY_IDS = {
    stx_itemType: 1,
    stx_manufacturer: 1,
    rarity: 1,
    weaponType: 1,
    ccGuidedItemType: 1,
    ccGuidedManufacturer: 1,
    ccGuidedWeaponType: 1
  };

  function onMainTopologyChange(ev) {
    var t = ev.target;
    if (!t || !t.id || !MAIN_TOPOLOGY_IDS[t.id]) return;
    craftSessionCounted = false;
    if (!mainSerialLooksComplete()) return;
    maybeBumpFirstCompleteThisSession();
  }

  function legitCodeComplete() {
    var el = byId('code-output');
    if (!el || el.classList.contains('empty')) return false;
    var tx = (el.textContent || '').trim();
    if (tx.length < 12) return false;
    if (/^no code generated/i.test(tx)) return false;
    return true;
  }

  function onLegitItemTypeChange(ev) {
    if (ev.target.id !== 'item-type') return;
    if (!legitCodeComplete()) return;
    bump('legit');
  }

  function onLegitResetClick(ev) {
    if (ev.target.id !== 'reset-btn') return;
    if (!legitCodeComplete()) return;
    bump('legit');
  }

  /* ---------- Panel & badge ---------- */

  var panelEl = null;
  var badgeEl = null;

  function ensurePanel() {
    if (panelEl) return panelEl;
    var style = document.createElement('style');
    style.textContent =
      '#stx-items-made-panel{position:fixed;z-index:99999;right:16px;bottom:16px;max-width:320px;' +
      'background:linear-gradient(145deg,rgba(5,12,24,0.96) 0%,rgba(10,8,22,0.92) 100%);' +
      'border:1px solid rgba(0,243,255,0.28);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5),' +
      '0 0 24px rgba(255,0,200,0.08);color:rgba(255,255,255,0.9);font:13px/1.45 system-ui,sans-serif;' +
      'padding:14px 16px;display:none;backdrop-filter:blur(8px);}' +
      '#stx-items-made-panel.stx-im-visible{display:block;}' +
      '#stx-items-made-panel h3{margin:0 0 8px;font-size:14px;font-weight:700;color:#00f3ff;' +
      'text-shadow:0 0 12px rgba(0,243,255,0.35);}' +
      '#stx-items-made-panel .stx-im-row{display:flex;justify-content:space-between;gap:12px;margin:4px 0;color:rgba(255,255,255,0.75);}' +
      '#stx-items-made-panel .stx-im-total{font-size:22px;font-weight:800;color:#e9feff;margin:6px 0 10px;' +
      'text-shadow:0 0 14px rgba(0,243,255,0.2);}' +
      '#stx-items-made-panel p.stx-im-hint{margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.45);line-height:1.4;}' +
      '#stx-items-made-panel .stx-im-actions{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;}' +
      '#stx-items-made-panel button{border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer;border:1px solid rgba(0,243,255,0.35);' +
      'background:linear-gradient(135deg,rgba(0,243,255,0.2) 0%,rgba(255,0,200,0.1) 100%);color:#e9feff;font-weight:600;}' +
      '#stx-items-made-panel button:hover{border-color:rgba(0,255,200,0.55);}' +
      '#stx-items-made-panel label.stx-im-cb{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.65);cursor:pointer;}' +
      '#stx-items-made-badge{position:fixed;z-index:99990;right:12px;top:56px;padding:4px 10px;border-radius:999px;' +
      'font:11px/1.3 system-ui,sans-serif;font-weight:700;color:rgba(233,254,255,0.88);' +
      'background:rgba(5,12,24,0.85);border:1px solid rgba(0,243,255,0.22);box-shadow:0 4px 14px rgba(0,0,0,.35);' +
      'display:none;pointer-events:none;}' +
      '#stx-items-made-badge.stx-im-badge-on{display:block;}';
    document.head.appendChild(style);

    panelEl = document.createElement('div');
    panelEl.id = 'stx-items-made-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-label', 'Items crafted tally');
    panelEl.innerHTML =
      '<h3>Items crafted</h3>' +
      '<div class="stx-im-total" id="stx-im-total">0</div>' +
      '<div class="stx-im-row"><span>Simple builder</span><strong id="stx-im-simple">0</strong></div>' +
      '<div class="stx-im-row"><span>Guided builder</span><strong id="stx-im-guided">0</strong></div>' +
      '<div class="stx-im-row"><span>Legit Builder</span><strong id="stx-im-legit">0</strong></div>' +
      '<hr id="stx-im-server-hr" style="display:none;border:none;border-top:1px solid rgba(0,243,255,0.15);margin:12px 0;"/>' +
      '<div class="stx-im-row" id="stx-im-server-row" style="display:none;"><span>Your visits (server)</span><strong id="stx-im-server-visits">â€”</strong></div>' +
      '<p class="stx-im-hint">Stored only in this browser. Count goes up when a serial is present and you switch item type, manufacturer, rarity, weapon type (or guided equivalents), or after a full Legit build when you change item type or hit Reset.</p>' +
      '<p class="stx-im-hint" id="stx-im-server-hint" style="display:none;margin-top:8px;">Server analytics: see repo <code>api/SETUP.md</code>. Dashboard: <code>stats.php?key=â€¦</code>. Meta: <code>stx-analytics-endpoint</code> or <code>STX_ANALYTICS_ENDPOINT</code>.</p>' +
      '<div class="stx-im-actions">' +
      '<label class="stx-im-cb"><input type="checkbox" id="stx-im-cb-badge"/> Corner badge</label>' +
      '<button type="button" id="stx-im-btn-reset">Reset counts</button>' +
      '<button type="button" id="stx-im-btn-close">Close</button></div>';
    document.body.appendChild(panelEl);

    badgeEl = document.createElement('div');
    badgeEl.id = 'stx-items-made-badge';
    document.body.appendChild(badgeEl);

    byId('stx-im-btn-close').addEventListener('click', function () {
      setPanelVisible(false);
    });
    byId('stx-im-btn-reset').addEventListener('click', function () {
      if (!confirm('Reset all craft counts for this browser?')) return;
      save({ total: 0, simple: 0, guided: 0, legit: 0 });
      refreshPanelIfOpen();
      updateBadge();
    });
    var cb = byId('stx-im-cb-badge');
    try {
      cb.checked = localStorage.getItem(BADGE_KEY) === '1';
    } catch (_) {}
    cb.addEventListener('change', function () {
      try {
        localStorage.setItem(BADGE_KEY, cb.checked ? '1' : '0');
      } catch (_) {}
      updateBadge();
    });

    try {
      window.addEventListener('stx-analytics', syncServerRow);
    } catch (_) {}

    return panelEl;
  }

  function syncServerRow() {
    var j = typeof window !== 'undefined' ? window.STX_ANALYTICS_LAST : null;
    var hr = byId('stx-im-server-hr');
    var row = byId('stx-im-server-row');
    var v = byId('stx-im-server-visits');
    var hint = byId('stx-im-server-hint');
    if (!row || !v) return;
    if (j && j.ok && typeof j.your_visits === 'number') {
      row.style.display = 'flex';
      if (hr) hr.style.display = 'block';
      v.textContent = String(j.your_visits);
      if (hint) hint.style.display = 'block';
    } else {
      row.style.display = 'none';
      if (hr) hr.style.display = 'none';
      if (hint) hint.style.display = 'none';
    }
  }

  function refreshPanelIfOpen() {
    if (!panelEl || !panelEl.classList.contains('stx-im-visible')) return;
    var d = load();
    var t = byId('stx-im-total');
    if (t) t.textContent = String(d.total);
    var s = byId('stx-im-simple');
    if (s) s.textContent = String(d.simple);
    var g = byId('stx-im-guided');
    if (g) g.textContent = String(d.guided);
    var l = byId('stx-im-legit');
    if (l) l.textContent = String(d.legit);
    syncServerRow();
  }

  function setPanelVisible(on) {
    ensurePanel();
    panelEl.classList.toggle('stx-im-visible', !!on);
    refreshPanelIfOpen();
  }

  function togglePanel() {
    ensurePanel();
    setPanelVisible(!panelEl.classList.contains('stx-im-visible'));
  }

  function updateBadge() {
    ensurePanel();
    var on = false;
    try {
      on = localStorage.getItem(BADGE_KEY) === '1';
    } catch (_) {}
    var d = load();
    badgeEl.textContent = 'Â· ' + d.total + ' crafted Â·';
    badgeEl.classList.toggle('stx-im-badge-on', on && d.total > 0);
  }

  function bindMainPageEggs() {
    var icon = document.querySelector('.header-bar .header-icon');
    if (!icon || icon.__stxItemsMadeBound) return;
    icon.__stxItemsMadeBound = true;
    icon.addEventListener('dblclick', function (ev) {
      if (!ev.shiftKey) return;
      ev.preventDefault();
      togglePanel();
    });
  }

  function bindLegitHeaderEgg() {
    var t = document.querySelector('.legit-header h1');
    if (!t || t.__stxItemsMadeBound) return;
    t.__stxItemsMadeBound = true;
    t.addEventListener('dblclick', function (ev) {
      if (!ev.shiftKey) return;
      ev.preventDefault();
      togglePanel();
    });
  }

  function onKeyDown(ev) {
    if (!ev.ctrlKey || !ev.altKey) return;
    if (String(ev.key || '').toLowerCase() !== 'm') return;
    ev.preventDefault();
    togglePanel();
  }

  function initMain() {
    document.addEventListener('change', onMainTopologyChange, true);
    document.addEventListener('input', function (ev) {
      var t = ev && ev.target;
      if (!t || !t.id) return;
      if (t.id === 'guidedOutputSerial' || t.id === 'outCode') maybeBumpFirstCompleteThisSession();
    }, true);
    document.addEventListener('click', function () {
      setTimeout(maybeBumpFirstCompleteThisSession, 120);
    }, true);
    document.addEventListener('keydown', onKeyDown);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        ensurePanel();
        bindMainPageEggs();
        updateBadge();
        hashOpen();
      });
    } else {
      ensurePanel();
      bindMainPageEggs();
      updateBadge();
      hashOpen();
    }
  }

  function hashOpen() {
    try {
      if (/[?&#]craft-stats/i.test(location.href) || /#craft-stats/i.test(location.hash)) {
        setTimeout(function () {
          setPanelVisible(true);
        }, 400);
      }
    } catch (_) {}
  }

  function initLegit() {
    document.addEventListener('change', onLegitItemTypeChange, true);
    document.addEventListener('click', onLegitResetClick, true);
    document.addEventListener('keydown', onKeyDown);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        ensurePanel();
        bindLegitHeaderEgg();
        updateBadge();
        hashOpen();
      });
    } else {
      ensurePanel();
      bindLegitHeaderEgg();
      updateBadge();
      hashOpen();
    }
  }

  if (byId('item-type') && byId('code-output')) {
    initLegit();
  } else {
    initMain();
  }

  window.STX_ITEMS_MADE = {
    getStats: load,
    resetStats: function () {
      save({ total: 0, simple: 0, guided: 0, legit: 0 });
      updateBadge();
      refreshPanelIfOpen();
    },
    showPanel: function () {
      setPanelVisible(true);
    },
    hidePanel: function () {
      setPanelVisible(false);
    },
    togglePanel: togglePanel
  };
})();

