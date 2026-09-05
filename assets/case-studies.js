(function () {
  var grid = document.getElementById('case-grid');
  var filterBar = document.getElementById('case-filter-bar');
  if (!grid) return;

  /* Save the static fallback HTML before we do anything */
  var staticHtml = grid.innerHTML;
  var skeletonCount = 6;

  /* ── Skeleton loader markup ── */
  function skeletonHtml() {
    var h = '';
    for (var i = 0; i < skeletonCount; i++) {
      h += '<div class="skeleton-card">'
        + '<div class="skeleton-pulse skeleton-tag"></div>'
        + '<div class="skeleton-pulse skeleton-line w50"></div>'
        + '<div class="skeleton-pulse skeleton-line w80"></div>'
        + '<div class="skeleton-pulse skeleton-line"></div>'
        + '<div class="skeleton-pulse skeleton-line w70"></div>'
        + '<div class="skeleton-chips">'
        + '<div class="skeleton-pulse skeleton-chip"></div>'
        + '<div class="skeleton-pulse skeleton-chip"></div>'
        + '<div class="skeleton-pulse skeleton-chip"></div>'
        + '</div>'
        + '</div>';
    }
    return h;
  }

  /* ── Build filter pills from cards in the DOM ── */
  function buildFilters() {
    if (!filterBar) return;
    var cards = document.querySelectorAll('.case-card');
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

  /* ── Wire filter clicks ── */
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.case-filter');
      if (!btn) return;
      applyFilter(btn.dataset.filter);
    });
  }

  /* ── Render real cards ── */
  function renderCards(cards) {
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    grid.innerHTML = cards.map(function (cs) {
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
    buildFilters();
  }

  /* ── Load from Supabase ── */
  if (window.supabase) {
    var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // Show skeletons while loading
    grid.innerHTML = skeletonHtml();

    (async function loadPublishedCaseStudies() {
      var result = await client
        .from('case_studies')
        .select('industry_tag, brand_name, headline_stat, blurb, chips, link_url')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (result.error || !result.data || !result.data.length) {
        // Restore the static fallback cards
        grid.innerHTML = staticHtml;
        buildFilters();
        return;
      }

      renderCards(result.data);
    })();
  } else {
    // No Supabase — just build filters from the static cards already in the DOM
    buildFilters();
  }
})();