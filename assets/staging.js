/* Populates the virtual-staging page's before/after gallery from the
   admin-managed staging_examples table. If any examples are published, they
   replace the default pairs baked into the HTML; if none are published
   (or the request fails), the default pairs are left untouched so the section
   is never empty. Shows skeleton loading while fetching. */
(function () {
  var gallery = document.getElementById('staging-gallery');
  if (!gallery) return;

  /* Save the static fallback HTML */
  var staticHtml = gallery.innerHTML;

  /* ── Skeleton loader ── */
  function skeletonGalleryHtml() {
    var h = '';
    for (var i = 0; i < 3; i++) {
      h += '<div class="skeleton-card" style="aspect-ratio:4/3;padding:0;gap:0;">'
        + '<div class="skeleton-pulse" style="width:100%;height:100%;border-radius:var(--r);"></div>'
        + '</div>';
    }
    return '<div class="ba-gallery-multi" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + h + '</div>';
  }

  if (!window.supabase) {
    // No Supabase — keep the static HTML
    if (window.initBaCompare) window.initBaCompare(gallery);
    return;
  }

  var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  // Show skeletons while loading
  gallery.innerHTML = skeletonGalleryHtml();

  (async function loadStagingExamples() {
    var result = await client
      .from('staging_examples')
      .select('label, before_url, after_url')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (result.error || !result.data || !result.data.length) {
      // Restore static fallback
      gallery.innerHTML = staticHtml;
      if (window.initBaCompare) window.initBaCompare(gallery);
      return;
    }

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    gallery.classList.toggle('ba-gallery-multi', result.data.length > 1);
    gallery.innerHTML = result.data.map(function (ex) {
      var caption = ex.label
        ? '<p class="ba-caption">' + esc(ex.label) + '</p>'
        : '';
      return '<figure class="ba-item-wrap">'
        + '<div class="ba-compare">'
        + '<img class="ba-img" src="' + esc(ex.before_url) + '" alt="Empty room before virtual staging" />'
        + '<div class="ba-after-wrap" aria-hidden="true">'
        + '<img class="ba-img" src="' + esc(ex.after_url) + '" alt="" />'
        + '</div>'
        + '<span class="ba-label before">Before</span>'
        + '<span class="ba-label after">After</span>'
        + '<div class="ba-divider" aria-hidden="true"></div>'
        + '<button class="ba-handle" type="button" role="slider"'
        + ' aria-label="Compare before and after staging"'
        + ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6"/></svg>'
        + '</button>'
        + '</div>'
        + caption
        + '</figure>';
    }).join('');

    // Wire the newly injected sliders
    if (window.initBaCompare) window.initBaCompare(gallery);
  })();
})();