/**
 * rebuild-credits-eggs.js - Credits, easter eggs, theme, full/no anim toggles
 */
(function(){
  var EGGS_KEY = 'stx_rebuild_eggs';
  var THEME_KEY = 'stx_rebuild_theme';
  var FULLANIM_KEY = 'stx_rebuild_fullanim';
  var NOANIM_KEY = 'stx_rebuild_noanim';
  var THEME_CLASS_BY_VALUE = { default: '', mattmab: 'mattmab-reskin', mac10: 'mac10-reskin', badley: 'badley-reskin', scooter: 'scooter-reskin', ynot: 'ynot-reskin', grimeey: 'grimeey-reskin', tobgun: 'tobgun-reskin' };

  function byId(id){ return document.getElementById(id); }
  function setEggsEnabled(on){
    try {
      localStorage.setItem(EGGS_KEY, on ? '1' : '0');
      if (!on) setTheme('default');
    } catch(_){}
  }
  function eggsEnabled(){ try { return localStorage.getItem(EGGS_KEY) !== '0'; } catch(_){ return true; } }
  function currentTheme(){ try { return localStorage.getItem(THEME_KEY) || 'default'; } catch(_){ return 'default'; } }
  function fullAnimEnabled(){
    try {
      var v = String(localStorage.getItem(FULLANIM_KEY) || '').toLowerCase();
      return v === '1' || v === 'true' || v === 'yes' || v === 'on';
    } catch(_){ return false; }
  }
  function noAnimEnabled(){
    try {
      var v = String(localStorage.getItem(NOANIM_KEY) || '').toLowerCase();
      return v === '1' || v === 'true' || v === 'yes' || v === 'on';
    } catch(_){ return false; }
  }
  function isEggThemeActive(){
    var b = document.body;
    if(!b) return false;
    return b.classList.contains('mattmab-reskin') ||
      b.classList.contains('mac10-reskin') ||
      b.classList.contains('badley-reskin') ||
      b.classList.contains('scooter-reskin') ||
      b.classList.contains('ynot-reskin') ||
      b.classList.contains('grimeey-reskin') ||
      b.classList.contains('tobgun-reskin');
  }
  function setTheme(theme){
    var body = document.body;
    Object.keys(THEME_CLASS_BY_VALUE).forEach(function(k){ var c = THEME_CLASS_BY_VALUE[k]; if(c) body.classList.remove(c); });
    var cls = THEME_CLASS_BY_VALUE[theme] || '';
    if(cls) body.classList.add(cls);
    try { localStorage.setItem(THEME_KEY, theme); } catch(_){}
    syncFullAnim();
    updateEggOffBtnVisibility();
  }

  function updateEggOffBtnVisibility(){
    var active = isEggThemeActive();
    var btns = [byId('eggOffBtn'), byId('eggOffBtnHeader')];
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i]) continue;
      btns[i].style.display = active ? 'inline-flex' : 'none';
      btns[i].hidden = !active;
    }
  }

  function disableEggTheme(){
    setEggsEnabled(false);
    setTheme('default');
  }

  /** Enable theme, or turn it off if that egg is already active. */
  function toggleEggTheme(theme){
    setEggsEnabled(true);
    if (currentTheme() === theme && isEggThemeActive()) {
      disableEggTheme();
      return;
    }
    setTheme(theme);
  }

  function toggleWithThanks(){
    var list = byId('withThanksList') || document.querySelector('.with-thanks-list');
    var icon = document.querySelector('.with-thanks-toggle .toggle-icon');
    var btn = byId('withThanksToggle');
    if(!list || !icon) return;
    list.classList.toggle('hidden');
    var open = !list.classList.contains('hidden');
    icon.textContent = open ? '-' : '+';
    if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    /* Expand first without sheen work; warm animations after paint/idle (mobile INP). */
    if (open) {
      list.classList.add('stx-thanks-cold');
      var warm = function () {
        try { list.classList.remove('stx-thanks-cold'); } catch (_) {}
      };
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(warm, 900);
      } else if (typeof window.stxYieldToMain === 'function') {
        window.requestAnimationFrame(function () { window.stxYieldToMain(warm); });
      } else {
        window.setTimeout(warm, 120);
      }
    } else {
      list.classList.add('stx-thanks-cold');
    }
  }
  window.toggleWithThanks = toggleWithThanks;

  function shuffleContributors(){
    var list = byId('withThanksList');
    if(!list) return;
    var items = Array.from(list.children);
    for(var i = items.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    items.forEach(function(el){ list.appendChild(el); });
  }

  function ensureTobgunContributor(){
    var list = byId('withThanksList');
    if (!list) return;
    var existing = byId('tobgunName');
    if (existing) return existing;
    var el = document.createElement('span');
    el.className = 'contributor-name';
    el.setAttribute('data-egg', '1');
    el.setAttribute('data-tooltip', '\uD83D\uDC40');
    el.id = 'tobgunName';
    el.title = '\uD83D\uDC40';
    el.textContent = 'Tobgun';
    var kids = Array.prototype.slice.call(list.children || []);
    var inserted = false;
    for (var i = 0; i < kids.length; i++) {
      var label = String(kids[i].textContent || '').trim();
      if (label.localeCompare('Tobgun', undefined, { sensitivity: 'base' }) > 0) {
        list.insertBefore(el, kids[i]);
        inserted = true;
        break;
      }
    }
    if (!inserted) list.appendChild(el);
    return el;
  }

  function initCredits(){
    var toggle = byId('withThanksToggle');
    if(toggle) toggle.addEventListener('click', toggleWithThanks);
    // Keep contributor order stable across reloads.

    ensureTobgunContributor();

    byId('mattmabName') && byId('mattmabName').addEventListener('dblclick', function(){
      toggleEggTheme('mattmab');
    });

    (function(){
      var el = byId('scooterMagooNameTop');
      if(!el) return;
      var clicks = 0, timer = 0;
      el.addEventListener('click', function(){
        clicks++;
        if(timer) clearTimeout(timer);
        timer = setTimeout(function(){ clicks = 0; }, 550);
        if(clicks < 2) return;
        clicks = 0;
        toggleEggTheme('scooter');
      });
    })();

    byId('mac10Name') && byId('mac10Name').addEventListener('click', function(){
      toggleEggTheme('mac10');
    });
    byId('badleyName') && byId('badleyName').addEventListener('click', function(){
      toggleEggTheme('badley');
    });
    byId('ynotName') && byId('ynotName').addEventListener('click', function(){
      toggleEggTheme('ynot');
    });
    byId('keepinItGrimeeyName') && byId('keepinItGrimeeyName').addEventListener('click', function(){
      toggleEggTheme('grimeey');
    });
    byId('tobgunName') && byId('tobgunName').addEventListener('click', function(){
      toggleEggTheme('tobgun');
    });

    function bindEggOff(btn){
      if (!btn) return;
      btn.addEventListener('click', function(){ disableEggTheme(); });
    }
    bindEggOff(byId('eggOffBtn'));
    bindEggOff(byId('eggOffBtnHeader'));

    if(eggsEnabled()) setTheme(currentTheme());
    else setTheme('default');

    var fullAnimToggle = byId('fullAnimToggle');
    var noAnimToggle = byId('noAnimToggle');
    if (noAnimToggle) {
      noAnimToggle.checked = noAnimEnabled();
      noAnimToggle.title = 'Stop all animations and motion completely';
      function onNoAnimChange(){
        try { localStorage.setItem(NOANIM_KEY, noAnimToggle.checked ? '1' : '0'); } catch(_){}
        syncFullAnim();
      }
      noAnimToggle.addEventListener('change', onNoAnimChange);
      noAnimToggle.addEventListener('input', onNoAnimChange);
    }
    if(fullAnimToggle) {
      fullAnimToggle.checked = fullAnimEnabled();
      if (document.documentElement.classList.contains('stx-lite-ui')) {
        fullAnimToggle.title = 'Full anim (off by default on mobile/lite — turn on if you want button sweeps)';
      } else {
        fullAnimToggle.title = 'Enable slow colour sweeps on buttons';
      }
      function onAnimToggleChange(){
        if (noAnimEnabled() || (noAnimToggle && noAnimToggle.checked)) return;
        try { localStorage.setItem(FULLANIM_KEY, fullAnimToggle.checked ? '1' : '0'); } catch(_){}
        syncFullAnim();
      }
      fullAnimToggle.addEventListener('change', onAnimToggleChange);
      fullAnimToggle.addEventListener('input', onAnimToggleChange);
    }
    syncFullAnim();
  }
  function syncFullAnim(){
    var noCb = byId('noAnimToggle');
    var noAnim = noCb ? !!noCb.checked : noAnimEnabled();
    document.documentElement.classList.toggle('stx-no-anim', noAnim);

    var cb = byId('fullAnimToggle');
    if (cb) {
      cb.disabled = noAnim;
      if (noAnim) {
        cb.checked = false;
        cb.title = 'Turn off No anim to enable Full anim';
      } else {
        cb.checked = fullAnimEnabled();
        if (document.documentElement.classList.contains('stx-lite-ui')) {
          cb.title = 'Full anim (off by default on mobile/lite — turn on if you want button sweeps)';
        } else {
          cb.title = 'Enable slow colour sweeps on buttons';
        }
      }
    }

    var enabled = !noAnim && (cb ? !!cb.checked : fullAnimEnabled());
    document.documentElement.classList.toggle('fullAnimButtons', enabled);
    document.documentElement.classList.toggle('stxEggFullAnim', enabled && isEggThemeActive());
  }

  function syncAnimPauseForVisibility(){
    try {
      document.documentElement.classList.toggle('stx-anim-paused', !!document.hidden);
    } catch (_) {}
  }
  syncAnimPauseForVisibility();
  document.addEventListener('visibilitychange', syncAnimPauseForVisibility);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCredits);
  else initCredits();
})();
