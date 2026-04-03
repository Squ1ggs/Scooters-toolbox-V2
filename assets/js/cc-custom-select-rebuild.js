/**
 * cc-custom-select-rebuild.js
 * Replaces native select dropdowns with custom-styled ones so the options list
 * has a dark background (native select options are often white and unstyled).
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  var DROPDOWN_BG = 'linear-gradient(135deg, rgba(0, 50, 100, 0.98) 0%, rgba(40, 0, 80, 0.98) 100%)';
  var DROPDOWN_HOVER = 'rgba(0, 150, 220, 0.4)';

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
    display.style.cssText = 'width:100%; padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:linear-gradient(135deg, rgba(0,100,180,0.35) 0%, rgba(80,0,120,0.35) 100%); color:var(--text-primary); font-size:12px; cursor:pointer; min-height:20px; display:flex; align-items:center; gap:8px; box-sizing:border-box;';
    display.setAttribute('aria-haspopup', 'listbox');
    display.setAttribute('role', 'combobox');

    var list = document.createElement('div');
    list.className = 'custom-select-list';
    list.style.cssText = 'display:none; position:absolute; left:0; right:0; top:100%; margin-top:2px; max-height:220px; overflow-y:auto; z-index:9999; border-radius:6px; border:1px solid rgba(0,243,255,0.35); box-shadow:0 8px 24px rgba(0,0,0,0.5); background:' + DROPDOWN_BG + ';';

    function iconSrcForOption(o) {
      if (!o || !o.getAttribute) return '';
      return String(o.getAttribute('data-cc-icon') || '').trim();
    }

    function iconFilterForOption(o) {
      if (!o || !o.getAttribute) return '';
      return String(o.getAttribute('data-cc-icon-filter') || '').trim();
    }

    function applyIconFilterToImg(im, o) {
      if (!im) return;
      var flt = iconFilterForOption(o);
      im.style.filter = flt || '';
    }

    function updateDisplay() {
      var opt = sel.options[sel.selectedIndex];
      display.innerHTML = '';
      var src = opt ? iconSrcForOption(opt) : '';
      var sub = opt && opt.getAttribute ? String(opt.getAttribute('data-cc-barrel-sub') || '').trim() : '';
      if (sub) {
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
        var im = document.createElement('img');
        im.className = 'custom-select-display-icon';
        im.alt = '';
        im.src = src;
        im.loading = 'lazy';
        im.decoding = 'async';
        applyIconFilterToImg(im, opt);
        im.addEventListener('error', function () { im.remove(); });
        topRow.appendChild(im);
      }
      var span = document.createElement('span');
      span.className = 'custom-select-display-text';
      span.style.cssText = sub
        ? 'flex:1;min-width:0;word-break:break-word;line-height:1.25;'
        : '';
      span.textContent = (opt && opt.text) ? opt.text.trim() : (sel.placeholder || '—');
      topRow.appendChild(span);
      display.appendChild(topRow);
      if (sub) {
        var subEl = document.createElement('div');
        subEl.className = 'custom-select-display-sub';
        subEl.style.cssText = 'font-size:11px;line-height:1.25;opacity:0.95;word-break:break-word;padding-left:0;';
        try { subEl.style.setProperty('color', '#ff7b7b', 'important'); } catch (_) { subEl.style.color = '#ff7b7b'; }
        subEl.textContent = sub.length > 140 ? sub.slice(0, 137) + '…' : sub;
        display.appendChild(subEl);
      }
    }

    function buildList() {
      list.innerHTML = '';
      function addOption(o) {
        var val = (o.value || '').trim();
        var txt = (o.text || val || '—').trim();
        var sub = o.getAttribute ? String(o.getAttribute('data-cc-barrel-sub') || '').trim() : '';
        var item = document.createElement('div');
        item.className = 'custom-select-option';
        item.style.cssText = sub
          ? 'padding:8px 10px; cursor:pointer; color:#fff; font-size:12px; display:flex; flex-direction:column; align-items:stretch; gap:4px; min-height:22px;'
          : 'padding:8px 10px; cursor:pointer; color:#fff; font-size:12px; display:flex; align-items:center; gap:8px; min-height:22px;';
        item.dataset.value = val;
        var topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;width:100%;min-width:0;';
        var src = iconSrcForOption(o);
        if (src) {
          var im = document.createElement('img');
          im.className = 'custom-select-option-icon';
          im.alt = '';
          im.src = src;
          im.loading = 'lazy';
          im.decoding = 'async';
          applyIconFilterToImg(im, o);
          im.addEventListener('error', function () { im.remove(); });
          im.style.flexShrink = '0';
          topRow.appendChild(im);
        }
        var span = document.createElement('span');
        span.style.cssText = sub
          ? 'flex:1;min-width:0;word-break:break-word;line-height:1.25;'
          : 'flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
        span.textContent = txt;
        topRow.appendChild(span);
        item.appendChild(topRow);
        if (sub) {
          var subEl = document.createElement('div');
          subEl.className = 'custom-select-option-sub';
          subEl.style.cssText = 'font-size:11px;line-height:1.3;opacity:0.96;width:100%;word-break:break-word;padding-left:0;';
          try { subEl.style.setProperty('color', '#ff7b7b', 'important'); } catch (_) { subEl.style.color = '#ff7b7b'; }
          subEl.textContent = sub.length > 200 ? sub.slice(0, 197) + '…' : sub;
          item.appendChild(subEl);
        }
        var tip = o.getAttribute('title') || (o.title || '');
        if (tip) item.setAttribute('title', tip);
        item.addEventListener('mouseenter', function () { this.style.background = DROPDOWN_HOVER; });
        item.addEventListener('mouseleave', function () { this.style.background = ''; });
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          sel.value = this.dataset.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          updateDisplay();
          list.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        });
        list.appendChild(item);
      }
      var children = sel.children || [];
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c.tagName === 'OPTGROUP') {
          var header = document.createElement('div');
          header.className = 'custom-select-group-header';
          header.style.cssText = 'padding:6px 10px 4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:rgba(0,243,255,0.9); border-bottom:1px solid rgba(0,243,255,0.2);' + (i > 0 ? ' margin-top:8px;' : '');
          header.textContent = c.label || '';
          list.appendChild(header);
          var opts = c.querySelectorAll ? c.querySelectorAll('option') : [];
          for (var j = 0; j < opts.length; j++) addOption(opts[j]);
        } else if (c.tagName === 'OPTION') {
          addOption(c);
        }
      }
    }

    function openList(e) {
      e.preventDefault();
      e.stopPropagation();
      buildList();
      list.style.display = 'block';
      document.addEventListener('click', closeHandler);
    }

    function closeHandler(e) {
      if (!wrapper.contains(e.target)) {
        list.style.display = 'none';
        document.removeEventListener('click', closeHandler);
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

    var origChange = sel.onchange;
    sel.addEventListener('change', function () {
      updateDisplay();
      if (typeof origChange === 'function') origChange.call(sel);
    });

    var selObs = new MutationObserver(function () { updateDisplay(); });
    selObs.observe(sel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-cc-barrel-sub', 'data-cc-icon', 'data-cc-icon-filter']
    });

    sel.__customSelectSync = updateDisplay;
  }

  function init() {
    var selects = document.querySelectorAll('select.editor-select, .editor-page select, .workspace select');
    for (var i = 0; i < selects.length; i++) wrapSelect(selects[i]);

    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType === 1) {
            if (n.tagName === 'SELECT' && (n.classList.contains('editor-select') || n.closest('.editor-page') || n.closest('.workspace'))) wrapSelect(n);
            var kids = n.querySelectorAll && n.querySelectorAll('select.editor-select, select');
            if (kids) for (var k = 0; k < kids.length; k++) wrapSelect(kids[k]);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
  setTimeout(init, 500);
})();
