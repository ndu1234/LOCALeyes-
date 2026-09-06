(function () {
  const form = document.getElementById('lead-form');
  if (!form || typeof window.supabase === 'undefined') return;

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const btn = form.querySelector('button[type="submit"]');
  const btnDefaultText = btn.textContent;
  const statusEl = document.getElementById('lead-form-status');
  const honeypot = form.querySelector('#hp-website');
  const loadedAt = Date.now();

  const SAVE_KEY = 'le_lead_draft';
  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    message: document.getElementById('message'),
  };

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'form-status' + (kind ? ' form-status-' + kind : '');
  }

  /* ── AUTOSAVE ── */
  function saveDraft() {
    try {
      var draft = {};
      Object.keys(fields).forEach(function (k) {
        draft[k] = fields[k] ? fields[k].value : '';
      });
      // Only save fields that actually have content — don't store empty strings forever.
      if (draft.name || draft.email || draft.message) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(SAVE_KEY);
      }
    } catch (e) { /* localStorage unavailable (private mode) — skip autosave silently */ }
  }

  function restoreDraft() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      Object.keys(fields).forEach(function (k) {
        if (fields[k] && draft[k]) fields[k].value = draft[k];
      });
    } catch (e) { /* corrupted draft — ignore and let the form start empty */ }
  }

  function clearDraft() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  // Save on every input (debounced via input events — cheap enough to skip debouncing)
  Object.keys(fields).forEach(function (k) {
    if (fields[k]) fields[k].addEventListener('input', saveDraft);
  });

  function fakeSuccess() {
    btn.textContent = 'Request Sent!';
    btn.style.background = '#22C55E';
    setStatus("Thanks — we'll be in touch within 1 business day.", 'success');
    form.reset();
    clearDraft();
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
    btn.innerHTML = '<span class="btn-spinner"></span>Sending...';
    setStatus('', '');

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      message: fields.message.value.trim() || null
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
    clearDraft();
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = btnDefaultText;
      btn.style.background = '';
    }, 4000);
  });

  restoreDraft();
})();