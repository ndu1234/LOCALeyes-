(function () {
  const form = document.getElementById('lead-form');
  if (!form || typeof window.supabase === 'undefined') return;

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const btn = form.querySelector('button[type="submit"]');
  const btnDefaultText = btn.textContent;
  const statusEl = document.getElementById('lead-form-status');
  const honeypot = form.querySelector('#hp-website');
  const loadedAt = Date.now();

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'form-status' + (kind ? ' form-status-' + kind : '');
  }

  function fakeSuccess() {
    btn.textContent = 'Request Sent!';
    btn.style.background = '#22C55E';
    setStatus("Thanks — we'll be in touch within 1 business day.", 'success');
    form.reset();
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = btnDefaultText;
      btn.style.background = '';
    }, 4000);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot filled, or submitted implausibly fast (< 2s) — silently
    // pretend success so bots don't learn to adapt.
    if ((honeypot && honeypot.value.trim() !== '') || Date.now() - loadedAt < 2000) {
      fakeSuccess();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    setStatus('', '');

    const payload = {
      name: form.querySelector('#name').value.trim(),
      email: form.querySelector('#email').value.trim(),
      business_name: form.querySelector('#business').value.trim(),
      phone: form.querySelector('#phone').value.trim() || null,
      service_interested: form.querySelector('#service').value,
      budget_range: form.querySelector('#budget').value,
      message: form.querySelector('#message').value.trim() || null
    };

    const { error } = await client.from('leads').insert([payload]);

    if (error) {
      btn.disabled = false;
      btn.textContent = btnDefaultText;
      setStatus('Something went wrong — please email hello@localeyes.agency directly.', 'error');
      return;
    }

    btn.textContent = 'Request Sent!';
    btn.style.background = '#22C55E';
    setStatus("Thanks — we'll be in touch within 1 business day.", 'success');
    form.reset();
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = btnDefaultText;
      btn.style.background = '';
    }, 4000);
  });
})();
