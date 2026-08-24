/* First-party analytics -- pageviews + service-card clicks. No PII, no IP
   logging: just an anonymous client-generated visitor id (localStorage) and
   the path/service clicked. Feeds analytics_events (see
   supabase/migrations/20260821143912_analytics_events.sql) and the admin
   dashboard's Traffic section (assets/admin.js).

   Deliberately NOT loaded on admin.html -- the founder's own dashboard visits
   aren't real site traffic and shouldn't be counted as such.

   Uses a raw fetch() to PostgREST directly rather than the @supabase/
   supabase-js SDK, so every public page stays light (no ~150KB SDK on pages
   that only ever need to fire an insert-only POST). keepalive:true is used
   so a service-card click's tracking call isn't dropped by the browser when
   the click also triggers navigation to a new page. */
(function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return; // config not loaded -- fail silent, never break the page

  var STORAGE_KEY = 'le_visitor_id';

  function getVisitorId() {
    try {
      var id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : fallbackUuid();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      return null; // localStorage unavailable (e.g. some private-browsing modes) -- skip tracking, don't error
    }
  }

  function fallbackUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function track(eventType, serviceName) {
    var visitorId = getVisitorId();
    if (!visitorId) return;

    var payload = { event_type: eventType, visitor_id: visitorId, path: location.pathname };
    if (serviceName) payload.service_name = serviceName;

    fetch(window.SUPABASE_URL + '/rest/v1/analytics_events', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: window.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + window.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    }).catch(function () {}); // best-effort -- an ad-blocker or offline visitor must never break the page
  }

  function serviceSlugFromHref(href) {
    // "services/paid-ads.html" or "../services/paid-ads.html" -> "paid-ads"
    var file = href.split('/').pop() || '';
    return file.replace(/\.html$/, '');
  }

  document.addEventListener('DOMContentLoaded', function () {
    track('pageview');

    document.querySelectorAll('.service-card').forEach(function (card) {
      card.addEventListener('click', function () {
        track('service_click', serviceSlugFromHref(card.getAttribute('href') || ''));
      });
    });
  });
})();
