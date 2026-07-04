/**
 * Advanced YAML extras: ammo editor, shiny gear flags, mayhem level.
 * Requires window.YAML_SAVE_CATALOG (assets/data/yaml_save_catalog.js).
 */
(function () {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function catalog() {
    return window.YAML_SAVE_CATALOG || null;
  }

  function shinyCatalogEntries() {
    var cat = catalog();
    if (cat && Array.isArray(cat.shiny_gear) && cat.shiny_gear.length) return cat.shiny_gear.slice();
    return [];
  }

  function ammoKeyList(yamlAmmo) {
    var cat = catalog();
    var base = (cat && cat.ammo_keys) ? cat.ammo_keys.slice() : ['assaultrifle', 'pistol', 'shotgun', 'smg', 'sniper', 'repkit'];
    var seen = {};
    var out = [];
    function add(k) {
      k = String(k || '').trim();
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push(k);
    }
    if (yamlAmmo && typeof yamlAmmo === 'object') Object.keys(yamlAmmo).forEach(add);
    base.forEach(add);
    return out;
  }

  function showExtrasMsg(text, isErr) {
    var el = byId('ccExtraYamlMsg');
    if (!el) return;
    if (!text) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.style.display = 'block';
    el.style.color = isErr ? '#ffb8b0' : '#00c8ff';
    el.textContent = text;
  }

  function renderAmmoList(data) {
    var host = byId('ccAmmoList');
    if (!host) return;
    host.innerHTML = '';
    if (!data || !data.state) {
      host.innerHTML = '<div style="color:#00c8ff; opacity:0.75; font-size:12px;">(Load YAML to list ammo keys)</div>';
      return;
    }
    var ammo = data.state.ammo || {};
    var keys = ammoKeyList(ammo);
    keys.forEach(function (key) {
      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.style.flexWrap = 'wrap';
      var lab = document.createElement('label');
      lab.setAttribute('for', 'cc-ammo-' + key);
      lab.textContent = key;
      lab.style.color = '#00c8ff';
      lab.style.minWidth = '110px';
      lab.style.fontSize = '0.9em';
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '0';
      inp.id = 'cc-ammo-' + key;
      inp.name = 'cc-ammo-' + key;
      inp.dataset.ccAmmoKey = key;
      inp.value = ammo[key] != null ? String(ammo[key]) : '0';
      inp.style.cssText = 'flex:1; min-width:120px; padding:8px 10px; background:#1f1f1f; border:1px solid rgba(0,243,255,0.45); border-radius:8px; color:#00f3ff;';
      row.appendChild(lab);
      row.appendChild(inp);
      host.appendChild(row);
    });
  }

  function shinyDisplayLabel(entry) {
    if (!entry) return '';
    var key = entry.key || '';
    var spawn = (window.SKIN_DATA && window.SKIN_DATA.spawn) || [];
    var i;
    if (entry.cosmetic) {
      for (i = 0; i < spawn.length; i++) {
        var sp = spawn[i];
        if (sp && sp.value && String(sp.value).toLowerCase() === String(entry.cosmetic).toLowerCase() && sp.label) {
          return String(sp.label).replace(/\s*-\s*/g, ' \u2014 ');
        }
      }
    }
    var guns = (window.LOOT_REFERENCE_DATA && window.LOOT_REFERENCE_DATA.shiny_guns) || [];
    for (i = 0; i < guns.length; i++) {
      var gun = guns[i];
      if (gun && gun.yaml_key === key && gun.display_name) {
        var prefix = gun.pearl || gun.variant === 'pearl' ? 'Pearlescent' : 'Phosphene';
        return prefix + ' \u2014 ' + gun.display_name;
      }
    }
    var lab = String(entry.label || '').trim();
    if (lab && !/^phosphene$/i.test(lab) && !/^pearl$/i.test(lab)) {
      if (/^pearl\s*[\u2014-]\s*/i.test(lab)) {
        return lab.replace(/^pearl\s*([\u2014-])\s*/i, 'Pearlescent $1 ');
      }
      return lab;
    }
    var slug = key.replace(/^shiny_/, '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    if (entry.pearl || entry.variant === 'pearl') return 'Pearlescent \u2014 ' + slug;
    return 'Phosphene \u2014 ' + slug;
  }

  function renderShinyList(data) {
    var host = byId('ccShinyGearList');
    if (!host) return;
    host.innerHTML = '';
    var entries = shinyCatalogEntries();
    if (!entries.length) {
      host.innerHTML = '<div style="color:#00c8ff; opacity:0.75; font-size:12px;">(Load yaml_save_catalog.js — run data refresh)</div>';
      return;
    }
    if (!data) {
      host.innerHTML = '<div style="color:#00c8ff; opacity:0.75; font-size:12px;">(Load YAML to list shiny gear flags)</div>';
      return;
    }
    var base = (data.stats && data.stats.shinygear && data.stats.shinygear.base) || {};
    var frag = document.createDocumentFragment();
    entries.forEach(function (entry) {
      var key = entry.key;
      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.gap = '8px';
      row.style.padding = '4px 0';
      row.style.borderBottom = '1px solid rgba(0,243,255,0.12)';
      var lab = document.createElement('label');
      lab.setAttribute('for', 'cc-shiny-' + key);
      lab.style.cssText = 'color:#00c8ff; font-size:0.85em; flex:1; cursor:pointer;';
      lab.textContent = shinyDisplayLabel(entry);
      lab.title =
        key +
        (entry.cosmetic ? ' → ' + entry.cosmetic : '') +
        (entry.inferred ? ' [inferred — shiny cosmetic not in inv_custom export yet]' : '') +
        (entry.idRaw ? ' skin ' + entry.idRaw : '');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'cc-shiny-' + key;
      cb.name = 'cc-shiny-' + key;
      cb.dataset.ccShinyKey = key;
      cb.checked = base[key] === 1 || base[key] === true;
      row.appendChild(lab);
      row.appendChild(cb);
      frag.appendChild(row);
    });
    host.appendChild(frag);
  }

  window.__ccSyncYamlExtrasFromData = function (data) {
    renderAmmoList(data);
    renderShinyList(data);
    var mayhemEl = byId('yaml-mayhem-level-unlocked');
    if (mayhemEl && data && data.globals && data.globals.highest_unlocked_mayhem_level != null) {
      mayhemEl.value = String(data.globals.highest_unlocked_mayhem_level);
    } else if (mayhemEl && (!data || !data.globals)) {
      mayhemEl.value = '';
    }
  };

  window.__ccApplyYamlExtrasToData = function (data) {
    if (!data) return data;
    data.state = data.state || {};
    var ammoHost = byId('ccAmmoList');
    if (ammoHost) {
      data.state.ammo = data.state.ammo || {};
      var inputs = ammoHost.querySelectorAll('input[data-cc-ammo-key]');
      for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        var k = inp.dataset.ccAmmoKey;
        if (!k || inp.value.trim() === '') continue;
        data.state.ammo[k] = parseInt(inp.value, 10) || 0;
      }
    }
    var shinyHost = byId('ccShinyGearList');
    if (shinyHost) {
      data.stats = data.stats || {};
      data.stats.shinygear = data.stats.shinygear || {};
      data.stats.shinygear.base = data.stats.shinygear.base || {};
      var boxes = shinyHost.querySelectorAll('input[data-cc-shiny-key]');
      for (var j = 0; j < boxes.length; j++) {
        var cb = boxes[j];
        var sk = cb.dataset.ccShinyKey;
        if (!sk) continue;
        data.stats.shinygear.base[sk] = cb.checked ? 1 : 0;
      }
    }
    var mayhemEl = byId('yaml-mayhem-level-unlocked');
    if (mayhemEl && mayhemEl.value.trim() !== '') {
      data.globals = data.globals || {};
      var maxM = (catalog() && catalog().progression_globals && catalog().progression_globals.highest_unlocked_mayhem_level)
        ? catalog().progression_globals.highest_unlocked_mayhem_level.max
        : 20;
      var mv = parseInt(mayhemEl.value, 10);
      if (!Number.isFinite(mv)) mv = 0;
      data.globals.highest_unlocked_mayhem_level = Math.max(0, Math.min(maxM, mv));
    }
    return data;
  };

  window.unlockAllShinyGear = function (value) {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var on = value !== 0 && value !== false;
    data.stats = data.stats || {};
    data.stats.shinygear = data.stats.shinygear || {};
    data.stats.shinygear.base = data.stats.shinygear.base || {};
    shinyCatalogEntries().forEach(function (entry) {
      data.stats.shinygear.base[entry.key] = on ? 1 : 0;
    });
    if (typeof window.commitYamlDataToEditor === 'function') window.commitYamlDataToEditor(data);
    if (typeof window.__ccSyncYamlExtrasFromData === 'function') window.__ccSyncYamlExtrasFromData(data);
    showExtrasMsg(on ? 'All catalog shiny gear flags set to 1.' : 'All catalog shiny gear flags set to 0.');
  };

  function wire() {
    var onBtn = byId('ccShinyAllOnBtn');
    var offBtn = byId('ccShinyAllOffBtn');
    if (onBtn && onBtn.dataset.ccWired !== '1') {
      onBtn.dataset.ccWired = '1';
      onBtn.addEventListener('click', function () { window.unlockAllShinyGear(1); });
    }
    if (offBtn && offBtn.dataset.ccWired !== '1') {
      offBtn.dataset.ccWired = '1';
      offBtn.addEventListener('click', function () { window.unlockAllShinyGear(0); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
