/* Populates the content-creation page's video gallery from the admin-managed
   content_videos table. If any videos are published they render as a grid of
   click-to-play tiles; if none are published (or the request fails) the whole
   section is hidden, so the page never shows an empty gallery. Shows skeleton
   loading while fetching. */
(function () {
  var section = document.getElementById('video-gallery-section');
  var gallery = document.getElementById('video-gallery');
  if (!section || !gallery) return;

  /* Hidden until we know there is something to show. */
  function hideSection() {
    section.style.display = 'none';
  }

  function skeletonGalleryHtml() {
    var h = '';
    for (var i = 0; i < 3; i++) {
      h += '<div class="skeleton-card" style="aspect-ratio:9/16;padding:0;gap:0;">'
        + '<div class="skeleton-pulse" style="width:100%;height:100%;border-radius:var(--r);"></div>'
        + '</div>';
    }
    return h;
  }

  if (!window.supabase) {
    hideSection();
    return;
  }

  var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  gallery.innerHTML = skeletonGalleryHtml();

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  (async function loadContentVideos() {
    var result = await client
      .from('content_videos')
      .select('label, video_url, poster_url')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (result.error || !result.data || !result.data.length) {
      hideSection();
      return;
    }

    gallery.innerHTML = result.data.map(function (v) {
      var caption = v.label
        ? '<p class="ba-caption">' + esc(v.label) + '</p>'
        : '';
      // preload="none" keeps the page light: with several videos on screen the
      // browser would otherwise fetch metadata for every one on load. The
      // poster (when set) is what visitors see until they press play.
      var poster = v.poster_url ? ' poster="' + esc(v.poster_url) + '"' : '';
      return '<figure class="video-item">'
        + '<video class="video-tile" src="' + esc(v.video_url) + '"' + poster
        + ' controls playsinline preload="none"></video>'
        + caption
        + '</figure>';
    }).join('');
  })();
})();
