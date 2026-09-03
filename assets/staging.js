/* Populates the virtual-staging page's before/after gallery from the
   admin-managed staging_examples table. If any examples are published, they
   replace the single default pair baked into the HTML; if none are published
   (or the request fails), the default pair is left untouched so the section
   is never empty. Mirrors the graceful-degradation pattern in
   case-studies.js. */
(function () {
  const gallery = document.getElementById('staging-gallery');
  if (!gallery || !window.supabase) return;

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sliderMarkup(ex) {
    const caption = ex.label
      ? `<p class="ba-caption">${escapeHtml(ex.label)}</p>`
      : '';
    return `
      <figure class="ba-item-wrap">
        <div class="ba-compare">
          <img class="ba-img" src="${escapeHtml(ex.before_url)}" alt="Empty room before virtual staging" />
          <div class="ba-after-wrap" aria-hidden="true">
            <img class="ba-img" src="${escapeHtml(ex.after_url)}" alt="" />
          </div>
          <span class="ba-label before">Before</span>
          <span class="ba-label after">After</span>
          <div class="ba-divider" aria-hidden="true"></div>
          <button class="ba-handle" type="button" role="slider"
            aria-label="Compare before and after staging"
            aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6"/></svg>
          </button>
        </div>
        ${caption}
      </figure>`;
  }

  (async function loadStagingExamples() {
    const { data, error } = await client
      .from('staging_examples')
      .select('label, before_url, after_url')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data || !data.length) return; // keep the default pair

    gallery.classList.toggle('ba-gallery-multi', data.length > 1);
    gallery.innerHTML = data.map(sliderMarkup).join('');

    // main.js defines this and already ran against the (now-replaced) default
    // slider; call it again to wire the freshly injected ones. Guarded in case
    // main.js hasn't parsed yet on a slow load.
    if (window.initBaCompare) window.initBaCompare(gallery);
  })();
})();
