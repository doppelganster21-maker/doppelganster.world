// theme.js - Dual Dark & Light Mode Theme Switcher & Mobile Nav Menu

(function () {
  const STORAGE_KEY = 'doppel_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleButtons(theme);
    updateFavicon(theme);
  }

  function updateFavicon(theme) {
    const favicon = document.getElementById('siteFavicon');
    if (favicon) {
      favicon.href = theme === 'dark' ? 'logo-dark.png' : 'logo-light.png';
    }
  }

  function updateToggleButtons(theme) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      const isDark = theme === 'dark';
      btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      btn.innerHTML = isDark
        ? `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9 4.17 0 7.67-2.84 8.68-6.73-.24.04-.49.07-.74.07-3.87 0-7-3.13-7-7 0-1.74.63-3.33 1.67-4.57C13.62 3.3 12.83 3 12 3z"/></svg>`;
    });
  }

  // Apply immediately before DOM render to prevent flashing
  const currentTheme = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', currentTheme);

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(currentTheme);
    updateFavicon(currentTheme);

    const navbar = document.querySelector('header.navbar');
    let lastScrollTop = 0;
    const threshold = 8;
    let scrollScheduled = false;

    // Scroll Handler: Auto-close mobile nav and hide navbar on scroll down, show on scroll up
    window.addEventListener('scroll', () => {
      if (scrollScheduled) return;
      scrollScheduled = true;

      requestAnimationFrame(() => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 1. Auto-close mobile menu if open
        if (navbar && navbar.classList.contains('menu-open')) {
          navbar.classList.remove('menu-open');
          const menuBtn = document.querySelector('.mobile-menu-btn');
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }

        // 2. Hide navbar on scroll down, show on scroll up
        if (Math.abs(lastScrollTop - scrollTop) > threshold) {
          if (scrollTop > lastScrollTop && scrollTop > 80) {
            if (navbar) navbar.classList.add('navbar-hidden');
          } else {
            if (navbar) navbar.classList.remove('navbar-hidden');
          }
          lastScrollTop = scrollTop;
        }

        scrollScheduled = false;
      });
    }, { passive: true });

    // Theme Toggle Handler
    document.addEventListener('click', (e) => {
      const themeBtn = e.target.closest('.theme-toggle-btn');
      if (themeBtn) {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        return;
      }

      // Mobile Menu Toggle Handler
      const menuBtn = e.target.closest('.mobile-menu-btn');
      if (menuBtn) {
        if (navbar) {
          navbar.classList.toggle('menu-open');
          const isOpen = navbar.classList.contains('menu-open');
          menuBtn.setAttribute('aria-expanded', isOpen);
        }
        return;
      }

      // Close menu if clicked link or outside header
      if (navbar && navbar.classList.contains('menu-open')) {
        if (e.target.closest('.main-nav a') || !e.target.closest('header.navbar')) {
          navbar.classList.remove('menu-open');
          const menuBtn = document.querySelector('.mobile-menu-btn');
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });
})();
