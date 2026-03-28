/**
 * Guided Enhancement Builder – manufacturer-centric UI.
 * Order: Manufacturer → Rarity → Perks (1,2,3,9) → Perk Stacking → 247 Secondary Stats.
 * Outputs to outCode, calls refreshOutputs.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function getPayload() {
    return window.__ENHANCEMENT_PAYLOAD || {};
  }

  function manufacturerNameFromCode(code) {
    var mfgs = (getPayload().manufacturers || {});
    for (var n in mfgs) if (mfgs[n].code === code) return n;
    return null;
  }

  function setRaritiesFor(mfgName) {
    var m = (getPayload().manufacturers || {})[mfgName] || {};
    var rarMap = m.rarities || {};
    var order = ['Common','Uncommon','Rare','Epic','Legendary'];
    var names = order.filter(function(r){ return r in rarMap; });
    var sel = byId('enhRaritySel');
    if (!sel) return;
    sel.innerHTML = '';
    names.forEach(function(r){
      var o = document.createElement('option');
      o.value = r;
      o.textContent = r + ' {' + rarMap[r] + '}';
      o.title = 'ID: {' + rarMap[r] + '} | Name: ' + r;
      sel.appendChild(o);
    });
    sel.selectedIndex = 0;
  }

  function setPerkCheckboxes(mfgName) {
    var rec = (getPayload().manufacturers || {})[mfgName];
    var byIdx = {};
    (rec && rec.perks || []).forEach(function(p){ byIdx[p.index] = p.name; });
    var order = [1,2,3,9];
    var box = byId('enhPerksBox');
    if (!box) return;
    box.innerHTML = '';
    order.forEach(function(code){
      if (byIdx[code]) {
        var wrap = document.createElement('label');
        wrap.className = 'perkRow';
        wrap.title = 'ID: {' + code + '} | Name: ' + byIdx[code];
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'enhPerk_' + code;
        cb.dataset.code = code;
        cb.addEventListener('change', rebuildEnhOutput);
        var span = document.createElement('span');
        span.textContent = '{' + code + '} ' + byIdx[code];
        wrap.appendChild(cb);
        wrap.appendChild(span);
        box.appendChild(wrap);
      }
    });
  }

  function buildStackTickboxes() {
    var current = (byId('enhMfgSel') || {}).value;
    var q = ((byId('enhStackFilter') || {}).value || '').toLowerCase();
    var recs = [];
    var mfgs = getPayload().manufacturers || {};
    Object.keys(mfgs).forEach(function(name){
      var obj = mfgs[name];
      if (name === current) return;
      (obj.perks || []).forEach(function(p){
        if ([1,2,3,9].indexOf(p.index) === -1) return;
        var text = '[' + p.index + '] ' + p.name + ' — ' + name;
        if (!q || text.toLowerCase().indexOf(q) !== -1) recs.push({code:obj.code,idx:p.index,text:text});
      });
    });
    recs.sort(function(a,b){ return (a.code - b.code) || (a.idx - b.idx); });
    var box = byId('enhStackBox');
    if (!box) return;
    box.innerHTML = '';
    var stackMap = window.__enhStackMap || {};
    recs.forEach(function(r, stackIdx){
      var raw = stackMap[r.code];
      var arr = Array.isArray(raw) ? raw : (raw && (raw.size || raw.length) ? Array.from(raw) : []);
      var cnt = arr.filter(function(x){ return x === r.idx; }).length;
      var wrap = document.createElement('label');
      wrap.className = 'perkRow';
      wrap.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;';
      wrap.title = 'ID: {' + r.code + '} [' + r.idx + '] | ' + r.text;
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'enh-stack-' + stackIdx;
      cb.name = cb.id;
      cb.dataset.code = r.code;
      cb.dataset.idx = r.idx;
      cb.checked = cnt > 0;
      var countSpan = document.createElement('span');
      countSpan.style.cssText = 'min-width:1.2em;font-size:0.9em;color:var(--text-secondary);';
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-Firmware';
      addBtn.textContent = '+';
      addBtn.style.cssText = 'padding:2px 8px;font-size:0.85em;';
      addBtn.title = 'Add another';
      var remBtn = document.createElement('button');
      remBtn.type = 'button';
      remBtn.className = 'btn btn-Firmware';
      remBtn.textContent = '−';
      remBtn.style.cssText = 'padding:2px 8px;font-size:0.85em;';
      remBtn.title = 'Remove one';
      function updateUI(){
        var map = window.__enhStackMap || {};
        var a = map[r.code] || [];
        var c = a.filter(function(x){ return x === r.idx; }).length;
        countSpan.textContent = c > 1 ? '(' + c + ')' : '';
        remBtn.style.display = c > 0 ? '' : 'none';
        cb.checked = c > 0;
      }
      cb.addEventListener('change', function(){
        window.__enhStackMap = window.__enhStackMap || {};
        if (!window.__enhStackMap[r.code]) window.__enhStackMap[r.code] = [];
        if (cb.checked) {
          window.__enhStackMap[r.code].push(r.idx);
        } else {
          window.__enhStackMap[r.code] = window.__enhStackMap[r.code].filter(function(x){ return x !== r.idx; });
          if (!window.__enhStackMap[r.code].length) delete window.__enhStackMap[r.code];
        }
        updateUI();
        rebuildEnhOutput();
      });
      addBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        window.__enhStackMap = window.__enhStackMap || {};
        if (!window.__enhStackMap[r.code]) window.__enhStackMap[r.code] = [];
        window.__enhStackMap[r.code].push(r.idx);
        cb.checked = true;
        updateUI();
        rebuildEnhOutput();
      });
      remBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        window.__enhStackMap = window.__enhStackMap || {};
        var a = window.__enhStackMap[r.code] || [];
        var i = a.indexOf(r.idx);
        if (i >= 0) {
          a.splice(i, 1);
          if (!a.length) delete window.__enhStackMap[r.code];
        }
        updateUI();
        rebuildEnhOutput();
      });
      var span = document.createElement('span');
      span.textContent = r.text;
      span.style.flex = '1';
      wrap.appendChild(cb);
      wrap.appendChild(span);
      wrap.appendChild(countSpan);
      wrap.appendChild(addBtn);
      wrap.appendChild(remBtn);
      updateUI();
      box.appendChild(wrap);
    });
  }

  function build247Tickboxes() {
    var recs = getPayload().secondary_247 || [];
    var q = ((byId('enhFilter247') || {}).value || '').toLowerCase();
    var filtered = recs.filter(function(r){ return (r.name || '').toLowerCase().indexOf(q) !== -1; });
    var box = byId('enh247Box');
    if (!box) return;
    box.innerHTML = '';
    var list247 = window.__enhList247 || [];
    var countOf = {};
    list247.forEach(function(c){ countOf[c] = (countOf[c] || 0) + 1; });
    filtered.forEach(function(r, idx){
      var wrap = document.createElement('label');
      wrap.className = 'perkRow';
      wrap.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;';
      wrap.title = 'ID: [' + r.code + '] | Name: ' + (r.name || '');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'enh-247-' + r.code + '-' + idx;
      cb.name = cb.id;
      cb.dataset.code = r.code;
      var cnt = countOf[r.code] || 0;
      cb.checked = cnt > 0;
      var countSpan = document.createElement('span');
      countSpan.style.cssText = 'min-width:1.2em;font-size:0.9em;color:var(--text-secondary);';
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-Firmware';
      addBtn.textContent = '+';
      addBtn.style.cssText = 'padding:2px 8px;font-size:0.85em;';
      addBtn.title = 'Add another';
      var remBtn = document.createElement('button');
      remBtn.type = 'button';
      remBtn.className = 'btn btn-Firmware';
      remBtn.textContent = '−';
      remBtn.style.cssText = 'padding:2px 8px;font-size:0.85em;';
      remBtn.title = 'Remove one';
      function updateCount(){
        var list = window.__enhList247 || [];
        var c = 0;
        list.forEach(function(x){ if (x === r.code) c++; });
        countSpan.textContent = c > 1 ? '(' + c + ')' : '';
        remBtn.style.display = c > 0 ? '' : 'none';
        cb.checked = c > 0;
      }
      cb.addEventListener('change', function(){
        window.__enhList247 = window.__enhList247 || [];
        if (cb.checked) {
          window.__enhList247.push(r.code);
        } else {
          window.__enhList247 = window.__enhList247.filter(function(x){ return x !== r.code; });
        }
        updateCount();
        rebuildEnhOutput();
      });
      addBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        window.__enhList247 = window.__enhList247 || [];
        window.__enhList247.push(r.code);
        cb.checked = true;
        updateCount();
        rebuildEnhOutput();
      });
      remBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        var list = window.__enhList247 || [];
        var i = list.indexOf(r.code);
        if (i >= 0) {
          list.splice(i, 1);
          window.__enhList247 = list;
        }
        updateCount();
        rebuildEnhOutput();
      });
      var span = document.createElement('span');
      span.textContent = '[' + r.code + '] ' + r.name;
      span.style.flex = '1';
      wrap.appendChild(cb);
      wrap.appendChild(span);
      wrap.appendChild(countSpan);
      wrap.appendChild(addBtn);
      wrap.appendChild(remBtn);
      updateCount();
      box.appendChild(wrap);
    });
  }

  function currentRarityCode() {
    var mfgSel = byId('enhMfgSel');
    var raritySel = byId('enhRaritySel');
    if (!mfgSel || !raritySel) return 0;
    var m = (getPayload().manufacturers || {})[mfgSel.value] || {};
    var rarMap = m.rarities || {};
    return rarMap[raritySel.value] || 0;
  }

  function rebuildEnhOutput() {
    var out = byId('guidedOutputDeserialized') || byId('outCode');
    if (!out) return;
    var mfgSel = byId('enhMfgSel');
    var raritySel = byId('enhRaritySel');
    if (!mfgSel || !raritySel) return;
    var m = (getPayload().manufacturers || {})[mfgSel.value] || {};
    var mfgCode = m.code || '###';
    var rndSeed = window.__enhRndSeed != null ? window.__enhRndSeed : (window.__enhRndSeed = Math.floor(1000 + Math.random() * 9000));
    var parts = [];
    parts.push(String(mfgCode) + ', 0, 1, 50| 2, ' + String(rndSeed) + '||');
    var r = currentRarityCode();
    if (r) parts.push(' {' + r + '}');
    var r247 = (getPayload().rarity_map_247 || {})[raritySel.value];
    if (r247) parts.push(' {247:' + r247 + '}');
    [1,2,3,9].forEach(function(code){
      var cb = byId('enhPerk_' + code);
      if (cb && cb.checked) parts.push(' {' + code + '}');
    });
    var stackMap = window.__enhStackMap || {};
    Object.keys(stackMap).forEach(function(k){
      var idxs = Array.from(stackMap[k]).sort(function(a,b){ return a - b; });
      if (idxs.length) parts.push(' {' + k + ':[' + idxs.join(' ') + ']}');
    });
    var list247 = window.__enhList247 || [];
    var delim = ((byId('enhDelim247') || {}).value || ' ').slice(0,3);
    if (list247.length) parts.push(' {247:[' + list247.join(delim) + ']}');
    out.value = parts.join(' ');
    try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
  }

  function populateManufacturers() {
    var sel = byId('enhMfgSel');
    if (!sel) return;
    var names = Object.keys(getPayload().manufacturers || {}).sort();
    sel.innerHTML = '';
    names.forEach(function(n){
      var m = (getPayload().manufacturers || {})[n];
      var o = document.createElement('option');
      o.value = n;
      o.textContent = n + ' (###=' + (m ? m.code : '') + ')';
      o.title = 'ID: ' + (m ? m.code : '') + ' | Name: ' + n;
      sel.appendChild(o);
    });
    sel.selectedIndex = 0;
  }

  function init() {
    if (!getPayload().manufacturers) return;
    populateManufacturers();
    setRaritiesFor((byId('enhMfgSel') || {}).value);
    setPerkCheckboxes((byId('enhMfgSel') || {}).value);
    buildStackTickboxes();
    build247Tickboxes();
    rebuildEnhOutput();

    var mfgSel = byId('enhMfgSel');
    if (mfgSel) {
      mfgSel.addEventListener('change', function(){
        var v = mfgSel.value;
        setRaritiesFor(v);
        setPerkCheckboxes(v);
        var code = ((getPayload().manufacturers || {})[v] || {}).code;
        if (code != null && window.__enhStackMap) delete window.__enhStackMap[code];
        buildStackTickboxes();
        rebuildEnhOutput();
      });
    }
    var raritySel = byId('enhRaritySel');
    if (raritySel) raritySel.addEventListener('change', rebuildEnhOutput);
    var stackFilter = byId('enhStackFilter');
    if (stackFilter) stackFilter.addEventListener('input', buildStackTickboxes);
    var clear247 = byId('enhClear247');
    if (clear247) clear247.addEventListener('click', function(){ window.__enhList247 = []; build247Tickboxes(); rebuildEnhOutput(); });
    var filter247 = byId('enhFilter247');
    if (filter247) filter247.addEventListener('input', build247Tickboxes);
    var dice = byId('enhDice');
    if (dice) dice.addEventListener('click', function(){ window.__enhRndSeed = Math.floor(1000 + Math.random() * 9000); rebuildEnhOutput(); });
  }

  window.__ccEnhancementChecklistRender = function() {
    if (!byId('enhMfgSel')) return;
    init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 50); });
  } else {
    setTimeout(init, 50);
  }
})();
