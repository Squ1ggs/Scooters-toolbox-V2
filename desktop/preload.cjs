const path = require('path');

function loadConfig() {
  try {
    const cfg = require(path.join(__dirname, 'remote-config.cjs'));
    return cfg && typeof cfg === 'object' ? cfg : {};
  } catch (_) {
    return {};
  }
}

(function applyRemoteConfig() {
  const cfg = loadConfig();
  const rawBase = typeof cfg.siteBaseUrl === 'string' ? cfg.siteBaseUrl.trim() : '';
  const base = rawBase.replace(/\/+$/, '');
  if (!base || /YOUR-SITE-NAME/.test(base)) return;

  window.STX_ANALYTICS_ENDPOINT = base + '/.netlify/functions/track';
  window.STX_COUNTER_URL = base + '/.netlify/functions/counter';
  window.STX_ITEMS_BUMP_URL = base + '/.netlify/functions/items-bump';

  if (typeof cfg.counterPublicKey === 'string' && cfg.counterPublicKey.trim()) {
    const sep = window.STX_COUNTER_URL.includes('?') ? '&' : '?';
    window.STX_COUNTER_URL += sep + 'key=' + encodeURIComponent(cfg.counterPublicKey.trim());
  }
  if (typeof cfg.analyticsTrackKey === 'string' && cfg.analyticsTrackKey.trim()) {
    window.STX_ANALYTICS_TRACK_KEY = cfg.analyticsTrackKey.trim();
  }
  if (typeof cfg.itemsBumpKey === 'string' && cfg.itemsBumpKey.trim()) {
    window.STX_ITEMS_BUMP_KEY = cfg.itemsBumpKey.trim();
  }
})();

window.addEventListener('DOMContentLoaded', () => {
  // Reserved for future safe desktop bridges.
});
