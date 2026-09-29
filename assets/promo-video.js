/* Landing-page promo video: play muted on a loop, but only when it's on
   screen, and never for visitors who've asked for reduced motion (they keep
   the poster frame). Lives in a file because the CSP blocks inline scripts. */
(function () {
  var video = document.querySelector('.lp-video');
  if (!video) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var play = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
  if (!('IntersectionObserver' in window)) { play(); return; }
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.isIntersecting ? play() : video.pause(); });
  }, { threshold: 0.25 }).observe(video);
})();
