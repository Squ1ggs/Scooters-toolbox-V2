/**
 * rebuild-credits-eggs.js - Credits, easter eggs, theme, full anim toggle
 */
(function(){
  var EGGS_KEY = 'stx_rebuild_eggs';
  var THEME_KEY = 'stx_rebuild_theme';
  var FULLANIM_KEY = 'stx_rebuild_fullanim';
  var THEME_CLASS_BY_VALUE = { default: '', mattmab: 'mattmab-reskin', mac10: 'mac10-reskin', badley: 'badley-reskin', scooter: 'scooter-reskin', ynot: 'ynot-reskin' };

  function byId(id){ return document.getElementById(id); }
  function setEggsEnabled(on){ try { localStorage.setItem(EGGS_KEY, on ? '1' : '0'); } catch(_){} }
  function eggsEnabled(){ try { return localStorage.getItem(EGGS_KEY) !== '0'; } catch(_){ return true; } }
  function currentTheme(){ try { return localStorage.getItem(THEME_KEY) || 'default'; } catch(_){ return 'default'; } }

  function setTheme(theme){
    var body = document.body;
    Object.keys(THEME_CLASS_BY_VALUE).forEach(function(k){ var c = THEME_CLASS_BY_VALUE[k]; if(c) body.classList.remove(c); });
    var cls = THEME_CLASS_BY_VALUE[theme] || '';
    if(cls) body.classList.add(cls);
    try { localStorage.setItem(THEME_KEY, theme); } catch(_){}
  }

  function toggleWithThanks(){
    var list = byId('withThanksList') || document.querySelector('.with-thanks-list');
    var icon = document.querySelector('.with-thanks-toggle .toggle-icon');
    var btn = byId('withThanksToggle');
    if(!list || !icon) return;
    list.classList.toggle('hidden');
    icon.textContent = list.classList.contains('hidden') ? '+' : '-';
    if(btn) btn.setAttribute('aria-expanded', list.classList.contains('hidden') ? 'false' : 'true');
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

  function initCredits(){
    var toggle = byId('withThanksToggle');
    if(toggle) toggle.addEventListener('click', toggleWithThanks);
    shuffleContributors();

    byId('mattmabName') && byId('mattmabName').addEventListener('dblclick', function(){
      setEggsEnabled(true);
      setTheme('mattmab');
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
        setEggsEnabled(true);
        setTheme(currentTheme() === 'scooter' ? 'default' : 'scooter');
      });
    })();

    byId('mac10Name') && byId('mac10Name').addEventListener('click', function(){
      setEggsEnabled(true);
      setTheme('mac10');
    });
    byId('badleyName') && byId('badleyName').addEventListener('click', function(){
      setEggsEnabled(true);
      setTheme('badley');
    });
    byId('ynotName') && byId('ynotName').addEventListener('click', function(){
      setEggsEnabled(true);
      setTheme('ynot');
    });

    if(eggsEnabled()) setTheme(currentTheme());
    else setTheme('default');

    var eggOffBtn = byId('eggOffBtn');
    if(eggOffBtn) eggOffBtn.addEventListener('click', function(){ setTheme('default'); });

    var fullAnimToggle = byId('fullAnimToggle');
    if(fullAnimToggle) {
      try { fullAnimToggle.checked = localStorage.getItem(FULLANIM_KEY) === '1'; } catch(_){}
      syncFullAnim();
      fullAnimToggle.addEventListener('change', function(){
        try { localStorage.setItem(FULLANIM_KEY, fullAnimToggle.checked ? '1' : '0'); } catch(_){}
        syncFullAnim();
      });
    }
  }
  function syncFullAnim(){
    var cb = byId('fullAnimToggle');
    if(!cb) return;
    if(cb.checked) document.documentElement.classList.add('fullAnimButtons');
    else document.documentElement.classList.remove('fullAnimButtons');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCredits);
  else initCredits();
})();
