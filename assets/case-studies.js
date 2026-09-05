(function () {
  const grid = document.getElementById('case-grid');
  const filterBar = document.getElementById('case-filter-bar');
  if (!grid) return;

  /* ── Build filter pills from case tags in the DOM ── */
  function buildFilters() {
    if (!filterBar) return;
    const cards = document.querySelectorAll('.case-card');
    var tags = [];
    cards.forEach(function (c) {
      var tag = c.querySelector('.case-tag');
      if (tag) tags.push(tag.textContent);
    });
    tags = Array.from(new Set(tags)).sort();
    if (tags.length < 2) { filterBar.style.display = 'none'; return; }
    filterBar.style.display = 'flex';
    var html = '<button class="case-filter active" data-filter="all">All Industries</button>';
    tags.forEach(function (t) {
      html += '<button class="case-filter" data-filter="' + t.replace(/"/g, '&quot;') + '">' + t.replace(/"/g, '&quot;') + '</button>';
    });
    filterBar.innerHTML = html;
  }

  /* ── Apply filter ── */
  function applyFilter(filter) {
    document.querySelectorAll('.case-filter').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    document.querySelectorAll('.case-card').forEach(function (card) {
      if (filter === 'all') { card.style.display = ''; return; }
      var tag = card.querySelector('.case-tag');
      card.style.display = tag && tag.textContent === filter ? '' : 'none';
    });
  }

  /* ── Wire filter clicks (delegated) ── */
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.case-filter');
      if (!btn) return;
      applyFilter(btn.dataset.filter);
    });
  }

  /* ── Load from Supabase (if available) ── */
  if (window.supabase) {
    var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    (async function loadPublishedCaseStudies() {
      var result = await client
        .from('case_studies')
        .select('industry_tag, brand_name, headline_stat, blurb, chips, link_url')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (result.error || !result.data || !result.data.length) {
        // Static cards already in the DOM — just build filters from them
        buildFilters();
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

      grid.innerHTML = result.data.map(function (cs) {
        return '<div class="case-card">'
          + '<span class="case-tag">' + esc(cs.industry_tag) + '</span>'
          + '<div class="case-brand">' + esc(cs.brand_name) + '</div>'
          + '<div class="case-stat">' + esc(cs.headline_stat) + '</div>'
          + '<p class="case-blurb">' + esc(cs.blurb) + '</p>'
          + ((cs.chips || []).length
            ? '<div class="case-chips">' + cs.chips.map(function (chip) { return '<span class="case-chip">' + esc(chip) + '</span>'; }).join('') + '</div>'
            : '')
          + (cs.link_url ? '<a href="' + esc(cs.link_url) + '" style="margin-top:14px;display:inline-block;font-size:13px;font-weight:700;color:var(--sky);text-decoration:none;">Learn more &rarr;</a>' : '')
          + '</div>';
      }).join('');

      // Rebuild filters from the newly loaded cards
      buildFilters();
    })();
  } else {
    // No Supabase — just build filters from the static cards
    buildFilters();
  }
})();