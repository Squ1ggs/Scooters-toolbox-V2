/**
 * cc-custom-select-rebuild.js
 * Replaces native select dropdowns with custom-styled ones so the options list
 * has a dark background (native select options are often white and unstyled).
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  var DROPDOWN_BG = 'linear-gradient(135deg, rgba(0, 50, 100, 1) 0%, rgba(40, 0, 80, 1) 100%)';
  var DROPDOWN_HOVER = 'rgba(0, 150, 220, 0.75)';
  var LIST_CHUNK_THRESHOLD = 18;
  var LIST_CHUNK_SIZE = 24;
  var iconWarmCache = Object.create(null);

  function warmIconSrc(src) {
    src = String(src || '').trim();
    if (!src) return;
    if (iconWarmCache[src] === 1) return;
    if (iconWarmCache[src] === 'pending') return;
    iconWarmCache[src] = 'pending';
    var im = new Image();
    im.decoding = 'async';
    im.onload = im.onerror = function () { iconWarmCache[src] = 1; };
    im.src = src;
  }

  function assignIconSrc(im, src) {
    src = String(src || '').trim();
    if (!im || !src) return;
    if (iconWarmCache[src] === 1) {
      im.src = src;
      return;
    }
    warmIconSrc(src);
    im.src = src;
  }

    var listDirty = true;

    function wrapSelect(sel) {
      if (!sel || sel.tagName !== 'SELECT' || sel.dataset.customSelect === 'yes') return;
      if (sel.size > 1) return;
      if (String(sel.getAttribute('data-native-select') || '').trim().toLowerCase() === 'yes') return;
      sel.dataset.customSelect = 'yes';

      var wrapper = document.createElement('div');
      wrapper.className = 'custom-select-wrapper';
      wrapper.style.cssText = 'position:relative; width:100%;';

      var display = document.createElement('div');
      display.className = 'custom-select-display editor-select';
      display.style.cssText = 'width:100%; padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:linear-gradient(135deg, rgba(0,100,180,1) 0%, rgba(80,0,120,1) 100%); color:var(--text-primary); font-size:12px; cursor:pointer; min-height:20px; display:flex; align-items:center; gap:8px; box-sizing:border-box;';
      display.setAttribute('aria-haspopup', 'listbox');
      display.setAttribute('role', 'combobox');

      var list = document.createElement('div');
      list.className = 'custom-select-list';
      list.style.cssText = 'display:none; position:absolute; left:0; right:0; top:100%; margin-top:2px; max-height:220px; overflow-y:auto; z-index:9999; border-radius:6px; border:1px solid rgba(0,243,255,0.35); box-shadow:0 8px 24px rgba(0,0,0,1); background:' + DROPDOWN_BG + ';';

      var wrapperListDirty = true;
      var listIconObserver = null;

    function iconSrcForOption(o) {
      if (!o || !o.getAttribute) return '';
      return String(o.getAttribute('data-cc-icon') || '').trim();
    }

    function iconFilterForOption(o) {
      if (!o || !o.getAttribute) return '';
      return String(o.getAttribute('data-cc-icon-filter') || '').trim();
    }

    function iconAltSrcForOption(o) {
      if (!o || !o.getAttribute) return '';
      return String(o.getAttribute('data-cc-icon-alt') || '').trim();
    }

    function bindIconErrorFallback(im, o) {
      if (!im || !o) return;
      var alt = iconAltSrcForOption(o);
      var triedAlt = false;
      im.addEventListener('load', function onIconOk() {
        try {
          im.style.visibility = '';
          im.style.opacity = '';
        } catch (_) {}
      });
      im.addEventListener('error', function onIconErr() {
        if (!triedAlt && alt) {
          triedAlt = true;
          im.src = alt;
          return;
        }
        try {
          im.style.visibility = 'hidden';
          im.style.opacity = '0';
          im.removeAttribute('src');
        } catch (_) {}
        im.removeEventListener('error', onIconErr);
      });
    }

    /** Always use a real <img>; CSS mask/multiply/filter on tier tints broke in Chromium/Electron. */
    function appendOptionIcon(topRow, o, imgClass, deferSrc) {
      if (!topRow || !o) return;
      var src = iconSrcForOption(o);
      if (!src) return;
      var flt = iconFilterForOption(o);
      var chip = document.createElement('span');
      chip.className = 'custom-select-icon-chip';

      var im = document.createElement('img');
      im.className = imgClass;
      im.alt = '';
      im.decoding = 'async';
      bindIconErrorFallback(im, o);
      if (deferSrc) {
        im.setAttribute('data-cc-defer-src', src);
      } else {
        assignIconSrc(im, src);
        im.loading = 'lazy';
      }
      if (flt) {
        var inner = document.createElement('span');
        inner.className = 'custom-select-icon-filter-wrap';
        inner.style.filter = flt;
        try { inner.style.setProperty('-webkit-filter', flt); } catch (_) {}
        inner.appendChild(im);
        chip.appendChild(inner);
      } else {
        chip.appendChild(im);
      }
      topRow.appendChild(chip);
    }

    function updateDisplay() {
      // Defer UI update to next frame to keep interaction responsive
      requestAnimationFrame(function () {
        var opt = sel.options[sel.selectedIndex];
        var src = opt ? iconSrcForOption(opt) : '';
        var flt = opt ? iconFilterForOption(opt) : '';
        var sub = opt && opt.getAttribute ? String(opt.getAttribute('data-cc-barrel-sub') || '').trim() : '';
        var descSub = opt && opt.getAttribute ? String(opt.getAttribute('data-cc-part-desc-sub') || '').trim() : '';
        var tone = opt && opt.getAttribute ? String(opt.getAttribute('data-cc-primary-tone') || '').trim() : '';
        var txt = (opt && opt.text) ? opt.text.trim() : (sel.placeholder || '—');

        if (display.dataset.lastTxt === txt && display.dataset.lastSrc === src && display.dataset.lastFlt === flt && display.dataset.lastSub === sub && display.dataset.lastDescSub === descSub && display.dataset.lastTone === tone) return;
        display.dataset.lastTxt = txt;
        display.dataset.lastSrc = src;
        display.dataset.lastFlt = flt;
        display.dataset.lastSub = sub;
        display.dataset.lastDescSub = descSub;
        display.dataset.lastTone = tone;

        display.innerHTML = '';
        if (sub || descSub) {
          display.style.flexDirection = 'column';
          display.style.alignItems = 'stretch';
          display.style.gap = '3px';
        } else {
          display.style.flexDirection = 'row';
          display.style.alignItems = 'center';
          display.style.gap = '8px';
        }
        var topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;min-width:0;';
        if (src) {
          appendOptionIcon(topRow, opt, 'custom-select-display-icon', false);
        }
        var span = document.createElement('span');
        span.className = 'custom-select-display-text';
        span.style.cssText = sub
          ? 'flex:1;min-width:0;word-break:break-word;line-height:1.25;'
          : '';
        span.textContent = txt;
        if (tone === 'legendary') {
          try { span.style.setProperty('color', '#ffcc70', 'important'); } catch (_) { span.style.color = '#ffcc70'; }
        }
        topRow.appendChild(span);
        display.appendChild(topRow);
        if (descSub) {
          var descEl = document.createElement('div');
          descEl.className = 'custom-select-display-desc';
          descEl.style.cssText = 'font-size:11px;line-height:1.3;color:rgba(0,243,255,0.82);word-break:break-word;padding-left:0;';
          descEl.textContent = descSub.length > 160 ? descSub.slice(0, 157) + '…' : descSub;
          display.appendChild(descEl);
        }
        if (sub) {
          var subEl = document.createElement('div');
          subEl.className = 'custom-select-display-sub';
          subEl.style.cssText = 'font-size:11px;line-height:1.25;opacity:1;word-break:break-word;padding-left:0;';
          try { subEl.style.setProperty('color', '#ff7b7b', 'important'); } catch (_) { subEl.style.color = '#ff7b7b'; }
          subEl.textContent = sub.length > 140 ? sub.slice(0, 137) + '…' : sub;
          display.appendChild(subEl);
        }
      });
    }

    function clearSelectLift(w) {
      var nodes = w.__ccLiftNodes;
      if (!nodes || !nodes.length) return;
      for (var i = 0; i < nodes.length; i++) {
        try {
          nodes[i].classList.remove('cc-custom-select-lift');
        } catch (_) {}
      }
      w.__ccLiftNodes = null;
    }

    /** Raise ancestor <details> / part panels so this dropdown stacks above following sections. */
    function applySelectLift(w) {
      clearSelectLift(w);
      var lift = [];
      var cur = w.parentElement;
      while (cur && cur !== document.body) {
        var cl = cur.classList;
        if (cl && (cl.contains('rebuild-details') || cl.contains('rebuild-part-expandable'))) {
          cur.classList.add('cc-custom-select-lift');
          lift.push(cur);
        }
        cur = cur.parentElement;
      }
      w.__ccLiftNodes = lift;
    }

    function finishCloseDropdown() {
      list.style.display = 'none';
      wrapper.classList.remove('is-open');
      wrapper.style.zIndex = '';
      clearSelectLift(wrapper);
      document.removeEventListener('click', closeHandler);
    }

    function buildList() {
      if (!wrapperListDirty) return;

      if (listIconObserver) {
        try { listIconObserver.disconnect(); } catch (_) {}
        listIconObserver = null;
      }

      listIconObserver = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var en = entries[i];
          if (!en.isIntersecting) continue;
          var row = en.target;
          var imgs = row.querySelectorAll ? row.querySelectorAll('img[data-cc-defer-src]') : [];
          for (var j = 0; j < imgs.length; j++) {
            var im = imgs[j];
            var ds = im.getAttribute('data-cc-defer-src');
            if (!ds) continue;
            assignIconSrc(im, ds);
            im.removeAttribute('data-cc-defer-src');
          }
          try { listIconObserver.unobserve(row); } catch (_) {}
        }
      }, { root: null, rootMargin: '120px 0px 120px 0px', threshold: 0 });

      var children = Array.prototype.slice.call(sel.children || []);

      function addOption(o, target) {
        var val = (o.value || '').trim();
        var txt = (o.text || val || '—').trim();
        var sub = o.getAttribute ? String(o.getAttribute('data-cc-barrel-sub') || '').trim() : '';
        var descSub = o.getAttribute ? String(o.getAttribute('data-cc-part-desc-sub') || '').trim() : '';
        var tone = o.getAttribute ? String(o.getAttribute('data-cc-primary-tone') || '').trim() : '';
        var tip = o.getAttribute('title') || (o.title || '');
        if (descSub) tip = tip ? (tip + ' | ' + descSub) : descSub;
        if (sub) {
          tip = tip ? (tip + ' | ' + sub) : sub;
        }
        var item = document.createElement('div');
        item.className = 'custom-select-option';
        item.style.cssText = 'padding:8px 10px; cursor:pointer; color:#fff; font-size:12px; display:flex; flex-direction:column; align-items:stretch; gap:4px; min-height:22px;';
        item.dataset.value = val;
        var topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;width:100%;min-width:0;';
        var src = iconSrcForOption(o);
        if (src) {
          appendOptionIcon(topRow, o, 'custom-select-option-icon', true);
          try { listIconObserver.observe(item); } catch (_) {
            var im0 = item.querySelector && item.querySelector('img[data-cc-defer-src]');
            if (im0) {
              assignIconSrc(im0, src);
              im0.removeAttribute('data-cc-defer-src');
            }
          }
        }
        var span = document.createElement('span');
        span.style.cssText = 'flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
        span.textContent = txt;
        if (tone === 'legendary') {
          try { span.style.setProperty('color', '#ffcc70', 'important'); } catch (_) { span.style.color = '#ffcc70'; }
        }
        topRow.appendChild(span);
        item.appendChild(topRow);
        if (descSub) {
          var descRow = document.createElement('div');
          descRow.className = 'custom-select-option-desc';
          descRow.style.cssText = 'font-size:11px;line-height:1.3;color:rgba(0,243,255,0.82);word-break:break-word;white-space:normal;width:100%;';
          descRow.textContent = descSub.length > 220 ? descSub.slice(0, 217) + '…' : descSub;
          item.appendChild(descRow);
        }
        if (sub) {
          var subRow = document.createElement('div');
          subRow.className = 'custom-select-option-sub';
          subRow.style.cssText = 'font-size:11px;line-height:1.3;color:#ff7b7b;word-break:break-word;white-space:normal;width:100%;';
          subRow.textContent = sub.length > 220 ? sub.slice(0, 217) + '…' : sub;
          item.appendChild(subRow);
        }
        if (tip) item.setAttribute('title', tip);
        item.addEventListener('mouseenter', function () { this.style.setProperty('background', DROPDOWN_HOVER, 'important'); });
        item.addEventListener('mouseleave', function () { this.style.removeProperty('background'); });
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          sel.value = this.dataset.value;
          updateDisplay();
          finishCloseDropdown();
          setTimeout(function () {
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }, 1);
        });
        target.appendChild(item);
      }

      if (children.length > LIST_CHUNK_THRESHOLD) {
        if (!list.innerHTML) list.innerHTML = '<div style="padding:10px;color:var(--text-muted);font-size:11px;">Loading options...</div>';

        var fragment = document.createDocumentFragment();
        var index = 0;
        function nextChunk() {
          var chunkEnd = Math.min(index + LIST_CHUNK_SIZE, children.length);
          for (; index < chunkEnd; index++) {
            var c = children[index];
            if (c.tagName === 'OPTGROUP') {
              var header = document.createElement('div');
              header.className = 'custom-select-group-header';
              header.style.cssText = 'padding:6px 10px 4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:rgba(0,243,255,0.9); border-bottom:1px solid rgba(0,243,255,0.2);' + (index > 0 ? ' margin-top:8px;' : '');
              header.textContent = c.label || '';
              fragment.appendChild(header);
              var opts = c.querySelectorAll ? c.querySelectorAll('option') : [];
              for (var j = 0; j < opts.length; j++) addOption(opts[j], fragment);
            } else if (c.tagName === 'OPTION') {
              addOption(c, fragment);
            }
          }
          if (index < children.length) {
            requestAnimationFrame(nextChunk);
          } else {
            list.innerHTML = '';
            list.appendChild(fragment);
            wrapperListDirty = false;
          }
        }
        nextChunk();
        return;
      }

      list.innerHTML = '';
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c.tagName === 'OPTGROUP') {
          var header = document.createElement('div');
          header.className = 'custom-select-group-header';
          header.style.cssText = 'padding:6px 10px 4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:rgba(0,243,255,0.9); border-bottom:1px solid rgba(0,243,255,0.2);' + (i > 0 ? ' margin-top:8px;' : '');
          header.textContent = c.label || '';
          fragment.appendChild(header);
          var opts = c.querySelectorAll ? c.querySelectorAll('option') : [];
          for (var j = 0; j < opts.length; j++) addOption(opts[j], fragment);
        } else if (c.tagName === 'OPTION') {
          addOption(c, fragment);
        }
      }
      list.appendChild(fragment);
      wrapperListDirty = false;
    }

    function openList(e) {
      e.preventDefault();
      e.stopPropagation();
      wrapper.classList.add('is-open');
      wrapper.style.zIndex = '2147483000';
      list.style.display = 'block';
      if (wrapperListDirty && !list.querySelector('.custom-select-option')) {
        list.innerHTML = '<div class="cc-custom-select-loading" style="padding:10px;color:var(--text-muted);font-size:11px;">Loading options...</div>';
      }
      applySelectLift(wrapper);
      document.addEventListener('click', closeHandler);
      requestAnimationFrame(function () { buildList(); });
    }

    function closeHandler(e) {
      if (!wrapper.contains(e.target)) {
        finishCloseDropdown();
      }
    }

    display.addEventListener('click', openList);

    sel.style.position = 'absolute';
    sel.style.left = '-9999px';
    sel.style.width = '1px';
    sel.style.height = '1px';
    sel.style.opacity = '0';
    sel.style.pointerEvents = 'none';

    wrapper.appendChild(display);
    wrapper.appendChild(list);
    sel.parentNode.insertBefore(wrapper, sel);
    wrapper.appendChild(sel);

    updateDisplay();

    try {
      var selOpt = sel.options[sel.selectedIndex];
      var warmSrc = selOpt ? iconSrcForOption(selOpt) : '';
      if (warmSrc) warmIconSrc(warmSrc);
    } catch (_) {}

    var origChange = sel.onchange;
    sel.addEventListener('change', function () {
      updateDisplay();
      if (typeof origChange === 'function') origChange.call(sel);
    });

    var selObs = new MutationObserver(function () {
      updateDisplay();
      wrapperListDirty = true;
    });
    selObs.observe(sel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-cc-barrel-sub', 'data-cc-part-desc-sub', 'data-cc-primary-tone', 'data-cc-icon', 'data-cc-icon-alt', 'data-cc-icon-filter']
    });

    sel.__customSelectSync = function ccSelectSyncInvalidate() {
      try {
        if (display && display.dataset) {
          delete display.dataset.lastTxt;
          delete display.dataset.lastSrc;
          delete display.dataset.lastFlt;
          delete display.dataset.lastSub;
          delete display.dataset.lastDescSub;
          delete display.dataset.lastTone;
        }
      } catch (_) {}
      updateDisplay();
    };
  }

  function init() {
    var selects = Array.prototype.slice.call(document.querySelectorAll('select.editor-select, .editor-page select, .app-shell select'));
    var idx = 0;
    function wrapChunk() {
      var end = Math.min(idx + 8, selects.length);
      for (; idx < end; idx++) wrapSelect(selects[idx]);
      if (idx < selects.length) {
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(wrapChunk, { timeout: 1200 });
        } else {
          setTimeout(wrapChunk, 0);
        }
      }
    }
    if (selects.length) wrapChunk();

    var observeRoot = document.querySelector('.app-shell') || document.querySelector('.editor-page') || document.body;
    var moRaf = 0;
    var pendingMo = [];
    var observer = new MutationObserver(function (mutations) {
      for (var mi = 0; mi < mutations.length; mi++) pendingMo.push(mutations[mi]);
      if (moRaf) return;
      moRaf = requestAnimationFrame(function () {
        moRaf = 0;
        var batch = pendingMo;
        pendingMo = [];
        try {
          for (var m = 0; m < batch.length; m++) {
            var added = batch[m].addedNodes;
            for (var j = 0; j < added.length; j++) {
              var n = added[j];
              if (n.nodeType === 1) {
                if (n.tagName === 'SELECT' && (n.classList.contains('editor-select') || n.closest('.editor-page') || n.closest('.app-shell'))) wrapSelect(n);
                var kids = n.querySelectorAll && n.querySelectorAll('select.editor-select, select');
                if (kids) for (var k = 0; k < kids.length; k++) wrapSelect(kids[k]);
              }
            }
          }
        } catch (_) {}
      });
    });
    observer.observe(observeRoot, { childList: true, subtree: true });
  }

  function bootCustomSelectRebuild() {
    if (window.__ccCustomSelectRebuildBoot) return;
    window.__ccCustomSelectRebuildBoot = true;
    init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootCustomSelectRebuild);
  } else if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(bootCustomSelectRebuild, { timeout: 2500 });
  } else {
    setTimeout(bootCustomSelectRebuild, 0);
  }

  try {
    window.__ccForceCustomSelectSync = function (sel) {
      if (!sel || typeof sel.__customSelectSync !== 'function') return;
      sel.__customSelectSync();
    };
  } catch (_) {}
})();
