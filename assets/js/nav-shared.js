/* ============================================
   NAV SHARED — JS de la nav principale Pulse
   Gère les dropdowns Produit / Solutions / Ressources
   ============================================ */
(function() {
  'use strict';

  function initNav() {
    var navItems = document.querySelectorAll('.nav-links > li');
    if (!navItems.length) return;

    navItems.forEach(function(item) {
      var btn = item.querySelector('button[aria-haspopup]');
      if (!btn) return;

      // Toggle on click (mobile + accessibility)
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = item.classList.contains('open');

        // Close all others
        navItems.forEach(function(other) {
          other.classList.remove('open');
          var otherBtn = other.querySelector('button[aria-haspopup]');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });

        // Toggle current
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      // Open on hover (desktop only)
      item.addEventListener('mouseenter', function() {
        if (window.innerWidth < 900) return;
        navItems.forEach(function(other) {
          other.classList.remove('open');
          var otherBtn = other.querySelector('button[aria-haspopup]');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      });

      item.addEventListener('mouseleave', function() {
        if (window.innerWidth < 900) return;
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on click outside
    document.addEventListener('click', function() {
      navItems.forEach(function(item) {
        item.classList.remove('open');
        var btn = item.querySelector('button[aria-haspopup]');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        navItems.forEach(function(item) {
          item.classList.remove('open');
          var btn = item.querySelector('button[aria-haspopup]');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Add `scrolled` class on scroll for subtle bg change
    var nav = document.querySelector('.nav');
    if (nav) {
      var onScroll = function() {
        if (window.scrollY > 10) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
