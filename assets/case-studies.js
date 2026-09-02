(function () {
  const grid = document.getElementById('case-grid');
  if (!grid || !window.supabase) return;

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  function escapeHtml(str) {
    // innerHTML round-tripping escapes & < > but NOT quotes -- and this
    // helper is used inside attribute values (href="..."), where an
    // embedded " would terminate the attribute and let the rest of the
    // string inject new ones. Escape all five metacharacters.
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  (async function loadPublishedCaseStudies() {
    const { data, error } = await client
      .from('case_studies')
      .select('industry_tag, brand_name, headline_stat, blurb, chips, link_url')
      .eq('published', true)
      .order('display_order', { ascending: true });

    // No published case studies yet (or the request failed) -- leave the
    // static placeholder examples already in the page untouched rather
    // than showing an empty grid.
    if (error || !data || !data.length) return;

    // Dynamically injected cards skip the .reveal scroll-fade-in class on
    // purpose: main.js sets up its IntersectionObserver once, synchronously,
    // against whatever .reveal elements exist at that point -- this fetch
    // resolves after that, so cards added here would never get observed
    // and would stay invisible under reveal's default pre-animation state.
    grid.innerHTML = data.map((cs) => `
      <div class="case-card">
        <span class="case-tag">${escapeHtml(cs.industry_tag)}</span>
        <div class="case-brand">${escapeHtml(cs.brand_name)}</div>
        <div class="case-stat">${escapeHtml(cs.headline_stat)}</div>
        <p class="case-blurb">${escapeHtml(cs.blurb)}</p>
        ${(cs.chips || []).length ? `
          <div class="case-chips">
            ${cs.chips.map((chip) => `<span class="case-chip">${escapeHtml(chip)}</span>`).join('')}
          </div>
        ` : ''}
        ${cs.link_url ? `<a href="${escapeHtml(cs.link_url)}" style="margin-top:14px; display:inline-block; font-size:13px; font-weight:700; color:var(--sky); text-decoration:none;">Learn more &rarr;</a>` : ''}
      </div>
    `).join('');
  })();
})();
