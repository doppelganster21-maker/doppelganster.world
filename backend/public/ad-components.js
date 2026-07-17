/**
 * Ad Components — Doppelganger.world
 *
 * Reusable ad placement functions (vanilla JS).
 * In development: renders styled labeled placeholders.
 * Production: replace placeholder innerHTML with real <ins class="adsbygoogle"> tags.
 *
 * Usage:
 *   AdBanner.leaderboard('container-id')
 *   AdBanner.inArticle('container-id')
 *   AdBanner.sidebar('container-id')
 *   AdBanner.responsive('container-id')
 *   AdBanner.stickyBottom()
 */

(function (global) {
  'use strict';

  // Replace with your AdSense publisher ID when approved
  var PUBLISHER_ID = 'YOUR_ADSENSE_PUBLISHER_ID';

  // Detect if real AdSense script is loaded
  function isAdSenseLoaded() {
    return typeof window.adsbygoogle !== 'undefined';
  }

  /**
   * Renders an AdSense unit or a dev placeholder into a container element.
   * @param {HTMLElement} container - The element to render the ad into
   * @param {string} label - Human-readable label for the ad slot
   * @param {string} slotId - AdSense ad slot ID (YOUR_AD_SLOT_ID)
   * @param {string} format - AdSense format ('auto', 'rectangle', 'vertical', 'horizontal')
   * @param {string} placeholderSize - Display text for placeholder (e.g. '728x90')
   */
  function renderAd(container, label, slotId, format, placeholderSize) {
    if (!container) return;

    var labelEl = document.createElement('div');
    labelEl.className = 'ad-label';
    labelEl.textContent = 'Advertisement';
    container.appendChild(labelEl);

    if (isAdSenseLoaded()) {
      // Production: Real AdSense tag
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', PUBLISHER_ID);
      ins.setAttribute('data-ad-slot', slotId);
      ins.setAttribute('data-ad-format', format);
      if (format === 'auto') {
        ins.setAttribute('data-full-width-responsive', 'true');
      }
      container.appendChild(ins);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    } else {
      // Development: Styled placeholder
      var placeholder = document.createElement('div');
      placeholder.className = 'ad-placeholder';
      placeholder.innerHTML = '<span>' + label + '<br><small style="opacity:0.85;font-weight:400">' + placeholderSize + '</small></span>';
      container.appendChild(placeholder);
    }
  }

  var AdBanner = {
    /**
     * Desktop Leaderboard — 728x90
     * Place at top of page or between sections.
     */
    leaderboard: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.classList.add('ad-container', 'ad-leaderboard');
      renderAd(container, 'Leaderboard Ad', 'YOUR_AD_SLOT_ID', 'horizontal', '728 x 90');
    },

    /**
     * In-Article Ad — 336x280
     * Place after first 2-3 paragraphs of content.
     */
    inArticle: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.classList.add('ad-container', 'ad-in-article');
      renderAd(container, 'In-Article Ad', 'YOUR_AD_SLOT_ID', 'rectangle', '336 x 280');
    },

    /**
     * Sidebar Ad — 300x600
     * Place in right sidebar column.
     */
    sidebar: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.classList.add('ad-container', 'ad-sidebar');
      renderAd(container, 'Sidebar Ad', 'YOUR_AD_SLOT_ID', 'vertical', '300 x 600');
    },

    /**
     * Responsive Ad
     * Adapts to container width. Best for mobile.
     */
    responsive: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.classList.add('ad-container', 'ad-responsive');
      renderAd(container, 'Responsive Ad', 'YOUR_AD_SLOT_ID', 'auto', 'Responsive');
    },

    /**
     * Sticky Bottom Ad — mobile only, 320x50
     * Creates and appends a fixed sticky bottom banner.
     */
    stickyBottom: function () {
      var wrap = document.createElement('div');
      wrap.className = 'ad-sticky-bottom-wrap';
      wrap.id = 'ad-sticky-bottom';
      var inner = document.createElement('div');
      inner.id = 'ad-sticky-bottom-inner';
      inner.classList.add('ad-container');
      wrap.appendChild(inner);
      document.body.appendChild(wrap);
      document.body.classList.add('has-sticky-ad');
      renderAd(inner, 'Mobile Banner', 'YOUR_AD_SLOT_ID', 'auto', '320 x 50');
    }
  };

  // Auto-initialize declared ad containers on DOMContentLoaded
  function autoInit() {
    // Leaderboard containers
    ['ad-leaderboard-top', 'ad-leaderboard-bottom'].forEach(function (id) {
      if (document.getElementById(id)) AdBanner.leaderboard(id);
    });
    // In-article containers
    ['ad-in-article-1', 'ad-in-article-2'].forEach(function (id) {
      if (document.getElementById(id)) AdBanner.inArticle(id);
    });
    // Sidebar
    if (document.getElementById('ad-sidebar-1')) AdBanner.sidebar('ad-sidebar-1');
    // Responsive
    ['ad-responsive-1', 'ad-responsive-footer'].forEach(function (id) {
      if (document.getElementById(id)) AdBanner.responsive(id);
    });
    // Sticky bottom on mobile
    if (window.innerWidth <= 768) {
      AdBanner.stickyBottom();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  global.AdBanner = AdBanner;
})(window);
