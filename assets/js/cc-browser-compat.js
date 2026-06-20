/**
 * cc-browser-compat.js — early host hints for lite perf (Edge/mobile) + idle scheduling.
 * Load without defer in <head> so html classes apply before first paint.
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var ua = navigator.userAgent || '';

  function mq(q) {
    try {
      return window.matchMedia(q).matches;
    } catch (_) {
      return false;
    }
  }

  var isEdge = /\bEdg\//.test(ua);
  var isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  var coarse = mq('(pointer: coarse)');
  var narrow = mq('(max-width: 768px)');
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;

  var touchUi = coarse || narrow || isMobileUa;
  var liteUi = touchUi || reduceMotion || lowMem || isEdge;

  if (touchUi) html.classList.add('stx-touch-ui');
  if (liteUi) html.classList.add('stx-lite-ui');
  if (isEdge) html.classList.add('stx-edge');
  if (reduceMotion) html.classList.add('stx-reduced-motion');

  if (typeof window.requestIdleCallback !== 'function') {
    window.requestIdleCallback = function (cb) {
      return window.setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return 0;
          }
        });
      }, 1);
    };
    window.cancelIdleCallback = function (id) {
      window.clearTimeout(id);
    };
  }

  function idleTimeout(defaultMs) {
    var base = Number(defaultMs) || 2000;
    return liteUi ? Math.max(base, Math.round(base * 1.75)) : base;
  }

  window.stxIsLiteUi = function () {
    return html.classList.contains('stx-lite-ui');
  };
  window.stxIsTouchUi = function () {
    return html.classList.contains('stx-touch-ui');
  };
  window.stxScheduleIdle = function (fn, timeoutMs) {
    var t = idleTimeout(timeoutMs);
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(fn, { timeout: t });
    }
    return window.setTimeout(fn, liteUi ? Math.min(t, 400) : 1);
  };
})();
