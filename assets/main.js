/* ══ NAV SCROLL STATE + MOBILE TOGGLE ══ */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

if (navToggle) {
  navToggle.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.body.classList.remove('nav-open'));
  });
}

/* ══ REVEAL ON SCROLL ══ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    revealObs.unobserve(e.target);
  });
}, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 6) * 0.08 + 's';
  revealObs.observe(el);
});

/* ══ STEP SLIDESHOWS (supports multiple per page) ══ */
document.querySelectorAll('.steps-slideshow').forEach(slideshow => {
  const wrap = slideshow.closest('section, div');
  const slides = Array.from(slideshow.querySelectorAll('.step-slide'));
  const progress = wrap ? wrap.querySelector('.steps-progress') : null;
  const pips = progress ? Array.from(progress.querySelectorAll('.step-pip')) : [];
  if (!slides.length || !pips.length) return;

  let curStep = 0, slideshowInterval = null, started = false;

  function goToStep(next) {
    const prev = curStep;
    if (prev === next) return;
    slides[prev].classList.add('exit');
    slides[prev].classList.remove('active');
    setTimeout(() => slides[prev].classList.remove('exit'), 600);
    slides[next].classList.add('active');
    pips[prev].classList.remove('playing');
    pips[prev].querySelector('.step-pip-fill').style.animation = 'none';
    armPip(next);
    curStep = next;
  }

  function armPip(i) {
    const fill = pips[i].querySelector('.step-pip-fill');
    pips[i].classList.add('playing');
    fill.style.animation = 'none';
    void fill.offsetWidth;
    fill.style.animation = 'pipFill 3.2s linear forwards';
  }

  function start() {
    if (started) return;
    started = true;
    armPip(0);
    slideshowInterval = setInterval(() => goToStep((curStep + 1) % slides.length), 3400);
  }

  pips.forEach((pip, i) => {
    pip.addEventListener('click', () => {
      clearInterval(slideshowInterval);
      goToStep(i);
      slideshowInterval = setInterval(() => goToStep((curStep + 1) % slides.length), 3400);
    });
  });

  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { start(); obs.disconnect(); } });
  }, { threshold: 0.4 });
  obs.observe(slideshow);
});

/* ══ METRIC COUNTERS (supports multiple grids per page) ══ */
document.querySelectorAll('.metrics-grid').forEach(grid => {
  let run = false;
  function startCounters() {
    if (run) return;
    run = true;
    grid.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const isFloat = String(target).includes('.');
      const dur = 1500, t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = (isFloat ? (target * e).toFixed(1) : Math.round(target * e)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { startCounters(); obs.disconnect(); } });
  }, { threshold: 0.35 });
  obs.observe(grid);
});

/* ══ FORMS (client-side stub — replace action with real endpoint later) ══ */
document.querySelectorAll('form[data-form]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = form.dataset.successText || 'Sent!';
    btn.style.background = '#22C55E';
    setTimeout(() => { btn.textContent = original; btn.style.background = ''; }, 3000);
  });
});

/* ══ BEFORE/AFTER COMPARISON SLIDER ══ */
document.querySelectorAll('.ba-compare').forEach(widget => {
  const handle = widget.querySelector('.ba-handle');
  if (!handle) return;

  function setPos(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    widget.style.setProperty('--pos', clamped);
    handle.setAttribute('aria-valuenow', Math.round(clamped));
  }

  function posFromEvent(e) {
    const rect = widget.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * 100;
  }

  // Drag from the handle (touch-action:none there keeps page scroll working
  // when a phone user is just swiping past the image itself)…
  let dragging = false;
  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    dragging = true;
    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* capture is an optimization, not required */ }
  });
  window.addEventListener('pointermove', e => {
    if (dragging) setPos(posFromEvent(e));
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointercancel', () => { dragging = false; });

  // …and let mouse users click anywhere on the image to jump the divider.
  widget.addEventListener('pointerdown', e => {
    if (e.target !== handle && e.pointerType === 'mouse') setPos(posFromEvent(e));
  });

  handle.addEventListener('keydown', e => {
    const cur = Number(widget.style.getPropertyValue('--pos')) || 50;
    if (e.key === 'ArrowLeft') { setPos(cur - 3); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { setPos(cur + 3); e.preventDefault(); }
    else if (e.key === 'Home') { setPos(0); e.preventDefault(); }
    else if (e.key === 'End') { setPos(100); e.preventDefault(); }
  });
});

/* ══ PAGE ENTRANCE ══ */
window.addEventListener('load', () => document.body.classList.add('loaded'));
