/* Vantage site shell behavior: mobile navigation and scroll reveal.
   Loaded with `defer` on every page. No dependencies. */
(function () {
  'use strict';

  var hdr = document.getElementById('hdr');
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('primary-nav');

  /* --- Mobile menu -------------------------------------------------------
     The outside-click and Escape handlers are bound only while the menu is
     open, so a page-wide listener never runs for a menu that is not there. */
  if (hdr && navToggle && navLinks) {
    var onOutsideClick = function (e) {
      if (!hdr.contains(e.target)) closeMenu();
    };
    var onKeydown = function (e) {
      if (e.key === 'Escape') { closeMenu(); navToggle.focus(); }
    };
    var setMenu = function (open) {
      hdr.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      var bind = open ? 'addEventListener' : 'removeEventListener';
      document[bind]('click', onOutsideClick);
      document[bind]('keydown', onKeydown);
    };
    var closeMenu = function () {
      if (hdr.classList.contains('menu-open')) setMenu(false);
    };

    navToggle.addEventListener('click', function () {
      setMenu(!hdr.classList.contains('menu-open'));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    addEventListener('resize', function () {
      if (innerWidth > 1040) closeMenu();
    });

    /* Header state: passive listener, at most one class write per frame. */
    var ticking = false;
    addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        hdr.classList.toggle('scrolled', scrollY > 10);
        ticking = false;
      });
    }, { passive: true });
  }

  /* --- Reveal on scroll --------------------------------------------------
     Stagger is computed within each visual group (the .reveal children of one
     parent), not across a flat document-order list, and the inline delay is
     removed once the reveal finishes so it cannot slow later transitions. */
  var targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var groups = new Set();
  targets.forEach(function (el) { groups.add(el.parentElement); });
  groups.forEach(function (group) {
    group.querySelectorAll(':scope > .reveal').forEach(function (el, i) {
      if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 60 + 'ms';
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      el.classList.add('in');
      if (!el.style.transitionDelay) return;
      el.addEventListener('transitionend', function () {
        el.style.transitionDelay = '';
      }, { once: true });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  targets.forEach(function (el) { io.observe(el); });
})();
