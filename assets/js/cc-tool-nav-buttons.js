/**
 * Icons for external toolbox nav links (dock + Tools panel).
 * Prefer icons already in the HTML; only decorate bare text links.
 */
(function () {
  'use strict';

  var ICONS = {
    './legacy/bl4-bulk-decoder.html': './assets/img/tool-nav/bulk-decoder.png',
    './assets/bulk-serial-validator.html': './assets/img/tool-nav/bulk-serial-validator.png',
    './assets/parts-stats-catalog.html': './assets/img/tool-nav/parts-stats-catalog.png',
    './legacy/prefix-lookup.html': './assets/img/tool-nav/prefix-lookup.png',
    './legacy/legit-builder.html': './assets/img/tool-nav/legit-builder.png',
    './assets/loot-reference.html': './assets/img/tool-nav/loot-reference.png',
    './assets/loot-reference.html#normal': './assets/img/tool-nav/loot-reference.png',
    './assets/stx-save-yaml-full.html': './assets/img/tool-nav/save-yaml.png',
  };

  function decorateLink(a) {
    if (!a) return;
    // Never wipe markup that already has an icon (dock HTML uses .stx-btn-ico).
    if (a.querySelector('.stx-btn-ico, .stx-tool-nav-btn__icon, img')) return;

    var href = String(a.getAttribute('href') || '').trim();
    var src = ICONS[href];
    if (!src) return;

    var label = String(a.textContent || '').trim();
    if (!label) return;

    a.classList.add('stx-tool-nav-btn');
    a.textContent = '';

    var img = document.createElement('img');
    img.className = 'stx-btn-ico';
    img.src = src;
    img.alt = '';
    img.width = 32;
    img.height = 32;
    img.decoding = 'async';
    img.setAttribute('aria-hidden', 'true');

    var span = document.createElement('span');
    span.textContent = label;

    a.appendChild(img);
    a.appendChild(document.createTextNode(' '));
    a.appendChild(span);
  }

  function run() {
    var sel =
      '.stxDockMoreToolsLinks a.btn--brand[href], .stxDockTopRow a.btn--brand[href], .stx-touch-tool-nav-link[href], #rebuildToolsPanel a.btn--brand[href], #yamlDrawerToolsRow a.btn--brand[href]';
    document.querySelectorAll(sel).forEach(decorateLink);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
