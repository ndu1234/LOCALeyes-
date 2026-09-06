/* ══ CONSENT MANAGEMENT ══
   Controls first-party analytics. No consent = no tracking. Preference is
   stored in localStorage and respected on every visit. The banner renders
   at the bottom of the viewport and does not block page content. */
(function () {
  var KEY = 'le_consent';
  var consent = localStorage.getItem(KEY); // 'granted' | 'denied' | null
  window.__consent = consent || 'pending';

  /* ── Show/hide banner ── */
  function showBanner() {
    var existing = document.getElementById('consent-banner');
    if (existing) { existing.classList.add('visible'); return; }

    var banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'cookie-banner visible';
    banner.innerHTML =
      '<p>This site uses first-party analytics to understand how visitors use it. No personal data is sold or shared. <a href="privacy.html">Learn more</a></p>'
      + '<div class="cookie-banner-actions">'
      + '<button class="btn btn-ghost" id="consent-deny" style="padding:8px 16px;font-size:12.5px;">Decline</button>'
      + '<button class="btn btn-primary" id="consent-accept" style="padding:8px 16px;font-size:12.5px;">Accept</button>'
      + '</div>';
    document.body.appendChild(banner);

    document.getElementById('consent-accept').addEventListener('click', function () {
      setConsent('granted');
    });
    document.getElementById('consent-deny').addEventListener('click', function () {
      setConsent('denied');
    });
  }

  function setConsent(value) {
    window.__consent = value;
    try { localStorage.setItem(KEY, value); } catch (e) {}
    var banner = document.getElementById('consent-banner');
    if (banner) banner.classList.remove('visible');
    // If consent was just granted, fire any pending analytics
    if (value === 'granted' && window.__consentCallbacks) {
      window.__consentCallbacks.forEach(function (fn) { fn(); });
      window.__consentCallbacks = [];
    }
  }

  /* ── Re-open banner (for "Cookie Preferences" link) ── */
  window.showConsentBanner = function () {
    setConsent('pending');
    showBanner();
  };

  /* ── Init ── */
  if (consent === 'granted') {
    window.__consent = 'granted';
    return; // No banner needed
  }
  if (consent === 'denied') {
    window.__consent = 'denied';
    return; // No banner needed
  }
  // pending — show the banner
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
