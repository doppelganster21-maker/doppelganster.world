/**
 * Cookie Consent Banner — Doppelganger.world
 * GDPR-compliant cookie consent with localStorage persistence.
 */
(function () {
  'use strict';

  const CONSENT_KEY = 'dg_cookie_consent';
  const CONSENT_VERSION = '1.0';

  function hasConsent() {
    try {
      const stored = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return stored && stored.version === CONSENT_VERSION && stored.accepted !== undefined;
    } catch (e) {
      return false;
    }
  }

  function setConsent(accepted) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        accepted: accepted,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  function hideBanner(banner) {
    banner.classList.remove('visible');
    setTimeout(function () {
      banner.style.display = 'none';
    }, 450);
  }

  function createBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = [
      '<div class="cookie-consent-text">',
      '  <p><strong>🍪 We use cookies</strong> to enhance your experience, serve personalized ads, and analyze site traffic. ',
      '  By clicking "Accept All", you agree to our use of cookies as described in our <a href="/cookie-policy.html">Cookie Policy</a>.</p>',
      '</div>',
      '<div class="cookie-consent-actions">',
      '  <button id="cookie-decline-btn" type="button" aria-label="Decline non-essential cookies">Decline</button>',
      '  <button id="cookie-accept-btn" type="button" aria-label="Accept all cookies">Accept All</button>',
      '</div>'
    ].join('');
    return banner;
  }

  function init() {
    if (hasConsent()) return;

    var banner = createBanner();
    document.body.appendChild(banner);

    // Slide up after a brief delay
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('visible');
      });
    });

    document.getElementById('cookie-accept-btn').addEventListener('click', function () {
      setConsent(true);
      hideBanner(banner);
      // Fire gtag consent update
      if (typeof gtag === 'function') {
        gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted' });
      }
    });

    document.getElementById('cookie-decline-btn').addEventListener('click', function () {
      setConsent(false);
      hideBanner(banner);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
