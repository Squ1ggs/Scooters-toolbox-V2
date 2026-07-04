/**
 * Icons for external toolbox nav links (dock + Tools panel).
 */
(function () {
  'use strict';

  var ICONS = {
    './legacy/bl4-bulk-decoder.html': './assets/favicon.svg',
    './assets/bulk-serial-validator.html': './assets/favicon.svg',
    './assets/parts-stats-catalog.html': './assets/favicon.svg',
    './legacy/prefix-lookup.html': './assets/favicon.svg',
    './legacy/legit-builder.html': './assets/favicon.svg',
    './assets/loot-reference.html': './assets/img/guided-dropdowns/legendary-augments/ico_legendary_aug_gun_assault.png',
    './assets/loot-reference.html#normal': './assets/img/guided-dropdowns/legendary-augments/ico_legendary_aug_grenade.png',
    './assets/stx-save-yaml-full.html': './assets/favicon.svg',
  };

  function decorateLink(a) {
    if (!a || a.querySelector('.stx-tool-nav-btn__icon')) return;
    var href = String(a.getAttribute('href') || '').trim();
    var src = ICONS[href] || './assets/favicon.svg';
    var label = String(a.textContent || '').trim();
    if (!label) return;
    a.classList.add('stx-tool-nav-btn');
    a.textContent = '';
    var img = document.createElement('img');
    img.className = 'stx-tool-nav-btn__icon';
    img.src = src;
    img.alt = '';
    img.width = 16;
    img.height = 16;
    img.decoding = 'async';
    img.loading = 'lazy';
    var span = document.createElement('span');
    span.textContent = label;
    a.appendChild(img);
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
