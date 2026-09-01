(function () {
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const loginScreen = document.getElementById('admin-login');
  const pendingScreen = document.getElementById('admin-pending');
  const resetScreen = document.getElementById('admin-reset');
  const dashboard = document.getElementById('admin-dashboard');

  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const authSub = document.getElementById('auth-sub');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const toggleModeLink = document.getElementById('toggle-mode');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const passwordGroup = document.getElementById('password-group');
  const passwordToggle = document.getElementById('password-toggle');
  const passwordToggleIcon = document.getElementById('password-toggle-icon');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const magicLinkToggle = document.getElementById('magic-link-toggle');
  const adminLoginLinks = document.getElementById('admin-login-links');

  const resetForm = document.getElementById('reset-form');
  const resetError = document.getElementById('reset-error');

  const pendingEmailEl = document.getElementById('pending-email');
  const pendingLogoutBtn = document.getElementById('pending-logout-btn');

  const logoutBtn = document.getElementById('logout-btn');
  const tbody = document.getElementById('leads-tbody');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const emptyState = document.getElementById('admin-empty');

  const addAdminForm = document.getElementById('add-admin-form');
  const addAdminEmail = document.getElementById('add-admin-email');
  const addAdminStatus = document.getElementById('add-admin-status');
  const statsEl = document.getElementById('admin-stats');

  const trafficStatsEl = document.getElementById('traffic-stats');
  const trafficTopPagesEl = document.getElementById('traffic-top-pages');
  const trafficTopServicesEl = document.getElementById('traffic-top-services');
  const trafficTrendEl = document.getElementById('traffic-trend');

  const clientsTbody = document.getElementById('clients-tbody');
  const clientsEmpty = document.getElementById('clients-empty');
  const addClientForm = document.getElementById('add-client-form');
  const addClientName = document.getElementById('add-client-name');
  const addClientStatus = document.getElementById('add-client-status');

  const clientsListView = document.getElementById('clients-list-view');
  const clientDetailView = document.getElementById('client-detail-view');
  const clientDetailName = document.getElementById('client-detail-name');
  const backToClientsBtn = document.getElementById('back-to-clients');

  const addCampaignForm = document.getElementById('add-campaign-form');
  const addCampaignName = document.getElementById('add-campaign-name');
  const addCampaignPlatform = document.getElementById('add-campaign-platform');
  const addCampaignObjective = document.getElementById('add-campaign-objective');
  const addCampaignBudget = document.getElementById('add-campaign-budget');
  const addCampaignStart = document.getElementById('add-campaign-start');
  const addCampaignEnd = document.getElementById('add-campaign-end');
  const addCampaignStatus = document.getElementById('add-campaign-status');
  const campaignsTbody = document.getElementById('campaigns-tbody');
  const campaignsEmpty = document.getElementById('campaigns-empty');

  const metricsSection = document.getElementById('metrics-section');
  const metricsCampaignName = document.getElementById('metrics-campaign-name');
  const metricsSummary = document.getElementById('metrics-summary');
  const metricsTbody = document.getElementById('metrics-tbody');
  const metricsEmpty = document.getElementById('metrics-empty');
  const addMetricForm = document.getElementById('add-metric-form');
  const addMetricDate = document.getElementById('add-metric-date');
  const addMetricImpressions = document.getElementById('add-metric-impressions');
  const addMetricClicks = document.getElementById('add-metric-clicks');
  const addMetricConversions = document.getElementById('add-metric-conversions');
  const addMetricSpend = document.getElementById('add-metric-spend');
  const addMetricRoas = document.getElementById('add-metric-roas');
  const addMetricStatus = document.getElementById('add-metric-status');

  const adminNavItems = document.querySelectorAll('.admin-nav-item');
  const adminTabPanels = document.querySelectorAll('.admin-tab-panel');

  function applyTab(tabName) {
    adminNavItems.forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
    adminTabPanels.forEach((p) => p.classList.toggle('active', p.dataset.panel === tabName));
  }

  adminNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      applyTab(item.dataset.tab);
      closeClientDetailView();
      history.pushState({ tab: item.dataset.tab }, '');
    });
  });

  // Opening a client's detail view (or switching tabs) never used to touch
  // browser history -- so hitting the back button from inside the admin
  // dashboard skipped straight past admin.html to whatever page was open
  // before it, instead of stepping back to the previous in-app view. Each
  // tab switch/detail-open now pushes a history entry, and this listener
  // replays that state on back/forward instead of re-pushing it.
  window.addEventListener('popstate', (e) => {
    const state = e.state || { tab: 'traffic' };
    applyTab(state.tab || 'traffic');
    if (state.view === 'client-detail' && state.clientId) {
      openClientDetail(state.clientId, { skipPush: true });
    } else {
      closeClientDetailView();
    }
  });

  let allLeads = [];
  let mode = 'signin'; // 'signin' | 'signup' | 'magiclink'
  let recoveryMode = false; // true while the user arrived via a password-recovery email link

  function showScreen(screen) {
    loginScreen.style.display = screen === 'login' ? 'flex' : 'none';
    pendingScreen.style.display = screen === 'pending' ? 'flex' : 'none';
    resetScreen.style.display = screen === 'reset' ? 'flex' : 'none';
    dashboard.style.display = screen === 'dashboard' ? 'flex' : 'none';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function setLoginMessage(text, isSuccess) {
    loginError.textContent = text;
    loginError.style.color = isSuccess ? 'var(--sky)' : '';
  }

  function updateAuthUI() {
    passwordGroup.style.display = mode === 'magiclink' ? 'none' : 'block';
    adminLoginLinks.style.display = mode === 'signup' ? 'none' : 'flex';
    forgotPasswordLink.style.display = mode === 'magiclink' ? 'none' : 'inline';
    adminLoginLinks.querySelector('.admin-login-links-sep').style.display = mode === 'magiclink' ? 'none' : 'inline';
    loginPasswordInput.required = mode !== 'magiclink';

    if (mode === 'signup') {
      authSub.textContent = 'Create an account, then ask an existing admin to approve it.';
      authSubmitBtn.textContent = 'Create Account';
      toggleModeLink.textContent = 'Already have an account? Sign in';
    } else if (mode === 'magiclink') {
      authSub.textContent = "We'll email you a link to sign in — no password needed.";
      authSubmitBtn.textContent = 'Send Magic Link';
      toggleModeLink.textContent = 'Need an account? Sign up';
      magicLinkToggle.textContent = 'Use password instead';
    } else {
      authSub.textContent = 'Sign in to view and manage leads.';
      authSubmitBtn.textContent = 'Sign In';
      toggleModeLink.textContent = 'Need an account? Sign up';
      magicLinkToggle.textContent = 'Sign in with email link';
    }
  }

  toggleModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'signup' ? 'signin' : 'signup';
    setLoginMessage('', false);
    updateAuthUI();
  });

  magicLinkToggle.addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'magiclink' ? 'signin' : 'magiclink';
    setLoginMessage('', false);
    updateAuthUI();
  });

  passwordToggle.addEventListener('click', () => {
    const showing = loginPasswordInput.type === 'text';
    loginPasswordInput.type = showing ? 'password' : 'text';
    passwordToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    passwordToggleIcon.innerHTML = showing
      ? '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.6 20.6 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.6 20.6 0 0 1-2.39 3.44M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  });

  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value.trim();
    if (!email) {
      setLoginMessage('Enter your email above first, then click "Forgot password?"', false);
      return;
    }
    setLoginMessage('Sending…', true);
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) {
      setLoginMessage(error.message, false);
      return;
    }
    // Deliberately worded not to confirm whether the email has an account -- avoids
    // leaking account existence to whoever is at this form.
    setLoginMessage('If an account exists for that email, a reset link is on its way.', true);
  });

  async function isApprovedAdmin(email) {
    const { data } = await client.from('admins').select('email').eq('email', email).maybeSingle();
    return !!data;
  }

  async function afterAuth(session) {
    if (recoveryMode) return; // the password-reset screen owns the UI until the password is updated
    if (!session) {
      showScreen('login');
      return;
    }
    const approved = await isApprovedAdmin(session.user.email);
    if (approved) {
      pendingEmailEl.textContent = '';
      showScreen('dashboard');
      if (!history.state) history.replaceState({ tab: 'traffic' }, '');
      loadLeads();
      loadTraffic();
      loadClients();
    } else {
      pendingEmailEl.textContent = session.user.email;
      showScreen('pending');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoginMessage('', false);
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (mode === 'magiclink') {
      // shouldCreateUser defaults to true, same as this site's existing open "Sign up" flow
      // (client.auth.signUp already lets anyone create a pending account for any email today).
      // Deliberately NOT set to false: that would make Supabase return a different error for
      // "no account" vs "sent", leaking which emails are registered admins via the API response
      // -- the same enumeration risk resetPasswordForEmail below is written to avoid.
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) {
        setLoginMessage(error.message, false);
        return;
      }
      setLoginMessage('Check your email for a sign-in link.', true);
      return;
    }

    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) {
        setLoginMessage(error.message, false);
        return;
      }
      if (!data.session) {
        setLoginMessage('Check your email to confirm your account, then sign in.', true);
        return;
      }
      afterAuth(data.session);
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginMessage('Invalid email or password.', false);
      return;
    }
    afterAuth(data.session);
  });

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetError.textContent = '';
    const password = document.getElementById('reset-password').value;
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      resetError.textContent = error.message;
      return;
    }
    recoveryMode = false;
    const { data: { session } } = await client.auth.getSession();
    afterAuth(session);
  });

  client.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryMode = true;
      showScreen('reset');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await client.auth.signOut();
    showScreen('login');
  });

  pendingLogoutBtn.addEventListener('click', async () => {
    await client.auth.signOut();
    showScreen('login');
  });

  addAdminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addAdminStatus.textContent = '';
    const email = addAdminEmail.value.trim().toLowerCase();
    const { error } = await client.from('admins').insert([{ email }]);
    if (error) {
      addAdminStatus.textContent = error.message.includes('duplicate') ? 'That email is already approved.' : 'Failed to approve: ' + error.message;
      return;
    }
    addAdminStatus.textContent = `${email} approved. They can now sign in.`;
    addAdminStatus.style.color = 'var(--sky)';
    addAdminForm.reset();
  });

  async function loadLeads() {
    const { data, error } = await client
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      emptyState.textContent = 'Could not load leads: ' + error.message;
      return;
    }

    allLeads = data || [];
    renderStats();
    renderLeads();
  }

  function renderStats() {
    const counts = { new: 0, contacted: 0, converted: 0, closed: 0 };
    allLeads.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });

    const cards = [
      { label: 'Total', num: allLeads.length },
      { label: 'New', num: counts.new },
      { label: 'Contacted', num: counts.contacted },
      { label: 'Converted', num: counts.converted },
      { label: 'Closed', num: counts.closed },
    ];

    statsEl.innerHTML = cards.map((c) => `
      <div class="admin-stat-card">
        <div class="admin-stat-num">${c.num}</div>
        <div class="admin-stat-label">${c.label}</div>
      </div>
    `).join('');
  }

  function renderLeads() {
    const q = searchInput.value.trim().toLowerCase();
    const statusVal = statusFilter.value;

    const filtered = allLeads.filter((l) => {
      const matchesQ = !q || [l.name, l.email, l.business_name].some((v) => (v || '').toLowerCase().includes(q));
      const matchesStatus = statusVal === 'all' || l.status === statusVal;
      return matchesQ && matchesStatus;
    });

    if (!filtered.length) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      emptyState.textContent = allLeads.length ? 'No leads match your filters.' : 'No leads yet.';
      return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map((l) => `
      <tr>
        <td>${escapeHtml(l.name)}<div class="lead-email">${escapeHtml(l.email)}</div></td>
        <td>${escapeHtml(l.business_name || '—')}</td>
        <td>${escapeHtml(l.service_interested || '—')}</td>
        <td>${escapeHtml(l.budget_range || '—')}</td>
        <td class="lead-message">${escapeHtml(l.message || '—')}</td>
        <td>${new Date(l.created_at).toLocaleDateString()}</td>
        <td>
          <select class="status-select ${l.status}" data-id="${l.id}">
            ${['new', 'contacted', 'converted', 'closed'].map((s) => `<option value="${s}" ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        const { error } = await client.from('leads').update({ status }).eq('id', id);
        if (error) {
          alert('Failed to update status: ' + error.message);
          return;
        }
        const lead = allLeads.find((l) => l.id === id);
        if (lead) lead.status = status;
        e.target.className = 'status-select ' + status;
        renderStats();
      });
    });
  }

  searchInput.addEventListener('input', renderLeads);
  statusFilter.addEventListener('change', renderLeads);

  function countBy(items, key) {
    const counts = {};
    items.forEach((item) => {
      const k = item[key];
      if (!k) return;
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }

  function renderBarChart(el, entries, emptyText) {
    if (!entries.length) {
      el.innerHTML = `<div class="admin-empty">${emptyText}</div>`;
      return;
    }
    const max = Math.max(...entries.map(([, count]) => count));
    el.innerHTML = entries.map(([label, count]) => `
      <div class="bar-row">
        <span class="bar-row-label">${escapeHtml(label)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${max ? (count / max) * 100 : 0}%"></span></span>
        <span class="bar-row-count">${count}</span>
      </div>
    `).join('');
  }

  function svgPoints(days, viewH) {
    const max = Math.max(1, ...days.map((d) => d.count));
    const n = days.length;
    return days.map((d, i) => ({
      x: n === 1 ? 0 : (i / (n - 1)) * 100,
      y: viewH - (d.count / max) * (viewH - 4) - 2,
    }));
  }

  function areaSvgMarkup(points, viewH) {
    // No per-point <circle> dots here on purpose: preserveAspectRatio="none" scales x/y
    // independently on a wide-short chart, which turns circles into ellipses. A crisp
    // endpoint marker is drawn separately in HTML instead (see renderAreaChart).
    const gradId = 'areaFill-' + Math.random().toString(36).slice(2);
    const line = points.map((p) => `${p.x},${p.y.toFixed(2)}`).join(' ');
    const area = `0,${viewH} ${line} 100,${viewH}`;
    return `
      <svg viewBox="0 0 100 ${viewH}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--sky)" stop-opacity="0.32" />
            <stop offset="100%" stop-color="var(--sky)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon points="${area}" fill="url(#${gradId})" />
        <polyline points="${line}" fill="none" stroke="var(--sky)" stroke-width="1" vector-effect="non-scaling-stroke" />
      </svg>
    `;
  }

  function renderAreaChart(el, days) {
    const viewH = 40;
    const points = svgPoints(days, viewH);
    const last = points[points.length - 1];
    el.innerHTML = `
      <div class="area-chart-svg">
        ${areaSvgMarkup(points, viewH)}
        <div class="area-chart-endpoint" style="left:${last.x}%; top:${(last.y / viewH) * 100}%"></div>
      </div>
      <div class="area-chart-labels">${days.map((d) => `<span>${escapeHtml(d.label)}</span>`).join('')}</div>
    `;
  }

  function sparklineSvg(days) {
    return areaSvgMarkup(svgPoints(days, 28), 28);
  }

  function bucketDaily(events, numDays, valueFn) {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayEvents = events.filter((e) => new Date(e.created_at).toDateString() === key);
      days.push({ label, count: valueFn(dayEvents) });
    }
    return days;
  }

  async function loadTraffic() {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from('analytics_events')
      .select('event_type, path, service_name, visitor_id, created_at')
      .gte('created_at', since30)
      .order('created_at', { ascending: false });

    if (error) {
      trafficStatsEl.innerHTML = '';
      trafficTopPagesEl.innerHTML = `<div class="admin-empty">Could not load traffic: ${escapeHtml(error.message)}</div>`;
      trafficTopServicesEl.innerHTML = '';
      return;
    }

    const events = data || [];
    const since7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const events7d = events.filter((e) => new Date(e.created_at).getTime() >= since7);
    const pageviews7d = events7d.filter((e) => e.event_type === 'pageview');
    const pageviews30d = events.filter((e) => e.event_type === 'pageview');
    const uniqueVisitors7d = new Set(events7d.map((e) => e.visitor_id)).size;

    const pageviews7dDaily = bucketDaily(events7d, 7, (d) => d.filter((e) => e.event_type === 'pageview').length);
    const uniqueVisitors7dDaily = bucketDaily(events7d, 7, (d) => new Set(d.map((e) => e.visitor_id)).size);
    const pageviews30dDaily = bucketDaily(events, 30, (d) => d.filter((e) => e.event_type === 'pageview').length);

    const cards = [
      { label: 'Pageviews (7d)', num: pageviews7d.length, spark: pageviews7dDaily },
      { label: 'Unique Visitors (7d)', num: uniqueVisitors7d, spark: uniqueVisitors7dDaily },
      { label: 'Pageviews (30d)', num: pageviews30d.length, spark: pageviews30dDaily },
    ];
    trafficStatsEl.innerHTML = cards.map((c) => `
      <div class="admin-stat-card admin-stat-card-spark">
        <div class="admin-stat-num">${c.num}</div>
        <div class="admin-stat-label">${c.label}</div>
        <div class="stat-sparkline">${sparklineSvg(c.spark)}</div>
      </div>
    `).join('');

    renderBarChart(trafficTopPagesEl, countBy(pageviews7d, 'path'), 'No pageviews yet.');
    renderBarChart(
      trafficTopServicesEl,
      countBy(events7d.filter((e) => e.event_type === 'service_click'), 'service_name'),
      'No service clicks yet.'
    );
    renderAreaChart(trafficTrendEl, pageviews7dDaily);
  }

  let allClients = [];
  let currentClientId = null;
  let currentCampaignId = null;

  async function loadClients() {
    const { data: clientRows, error: clientErr } = await client
      .from('clients')
      .select('id, company_name, status')
      .order('company_name', { ascending: true });

    if (clientErr) {
      clientsTbody.innerHTML = '';
      clientsEmpty.style.display = 'block';
      clientsEmpty.textContent = 'Could not load clients: ' + clientErr.message;
      return;
    }

    allClients = clientRows || [];
    renderClients(allClients);
  }

  function renderClients(clients) {
    if (!clients.length) {
      clientsTbody.innerHTML = '';
      clientsEmpty.style.display = 'block';
      clientsEmpty.textContent = 'No clients yet — add one above.';
      return;
    }

    clientsEmpty.style.display = 'none';
    clientsTbody.innerHTML = clients.map((c) => `
        <tr>
          <td>${escapeHtml(c.company_name)}</td>
          <td><span class="status-select ${c.status}">${escapeHtml(c.status)}</span></td>
          <td><button type="button" class="btn btn-ghost clients-manage-btn" data-client-id="${c.id}">Manage</button></td>
        </tr>
      `).join('');

    clientsTbody.querySelectorAll('.clients-manage-btn').forEach((btn) => {
      btn.addEventListener('click', () => openClientDetail(btn.dataset.clientId));
    });
  }

  addClientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addClientStatus.textContent = '';
    const companyName = addClientName.value.trim();
    const { error } = await client.from('clients').insert([{ company_name: companyName }]);
    if (error) {
      addClientStatus.textContent = 'Failed to add client: ' + error.message;
      return;
    }
    addClientStatus.textContent = `${companyName} added.`;
    addClientStatus.style.color = 'var(--sky)';
    addClientForm.reset();
    loadClients();
  });

  function openClientDetail(clientId, opts = {}) {
    const clientRow = allClients.find((c) => c.id === clientId);
    if (!clientRow) return;
    currentClientId = clientId;
    currentCampaignId = null;
    clientDetailName.textContent = clientRow.company_name;
    metricsSection.style.display = 'none';
    clientsListView.style.display = 'none';
    clientDetailView.style.display = 'block';
    loadCampaigns();
    if (!opts.skipPush) {
      history.pushState({ tab: 'clients', view: 'client-detail', clientId }, '');
    }
  }

  function closeClientDetailView() {
    currentClientId = null;
    currentCampaignId = null;
    clientDetailView.style.display = 'none';
    clientsListView.style.display = 'block';
  }

  backToClientsBtn.addEventListener('click', () => {
    history.back();
  });

  let allCampaigns = [];
  const CAMPAIGN_STATUSES = ['draft', 'live', 'paused', 'ended'];

  async function loadCampaigns() {
    const { data, error } = await client
      .from('campaigns')
      .select('id, name, platform, objective, budget, status, start_date, end_date')
      .eq('client_id', currentClientId)
      .order('start_date', { ascending: false, nullsFirst: false });

    if (error) {
      campaignsTbody.innerHTML = '';
      campaignsEmpty.style.display = 'block';
      campaignsEmpty.textContent = 'Could not load campaigns: ' + error.message;
      return;
    }

    allCampaigns = data || [];
    renderCampaigns();
  }

  function formatMoney(n) {
    return n == null ? '—' : '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function formatDateRange(start, end) {
    if (!start && !end) return '—';
    const fmt = (d) => new Date(d).toLocaleDateString();
    return `${start ? fmt(start) : '…'} – ${end ? fmt(end) : '…'}`;
  }

  function renderCampaigns() {
    if (!allCampaigns.length) {
      campaignsTbody.innerHTML = '';
      campaignsEmpty.style.display = 'block';
      campaignsEmpty.textContent = 'No campaigns yet — add one above.';
      return;
    }

    campaignsEmpty.style.display = 'none';
    campaignsTbody.innerHTML = allCampaigns.map((c) => `
        <tr class="campaign-row ${c.id === currentCampaignId ? 'active-row' : ''}" data-campaign-id="${c.id}">
          <td>${escapeHtml(c.name)}</td>
          <td>${escapeHtml(c.platform || '—')}</td>
          <td>${escapeHtml(c.objective || '—')}</td>
          <td>${formatMoney(c.budget)}</td>
          <td>${formatDateRange(c.start_date, c.end_date)}</td>
          <td>
            <select class="status-select ${c.status}" data-campaign-id="${c.id}">
              ${CAMPAIGN_STATUSES.map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>
      `).join('');

    campaignsTbody.querySelectorAll('.campaign-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.status-select')) return;
        openMetrics(row.dataset.campaignId);
      });
    });

    campaignsTbody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('click', (e) => e.stopPropagation());
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.campaignId;
        const status = e.target.value;
        const { error } = await client.from('campaigns').update({ status }).eq('id', id);
        if (error) {
          alert('Failed to update status: ' + error.message);
          return;
        }
        const c = allCampaigns.find((x) => x.id === id);
        if (c) c.status = status;
        e.target.className = 'status-select ' + status;
      });
    });
  }

  addCampaignForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addCampaignStatus.textContent = '';
    const row = {
      client_id: currentClientId,
      name: addCampaignName.value.trim(),
      platform: addCampaignPlatform.value || null,
      objective: addCampaignObjective.value.trim() || null,
      budget: addCampaignBudget.value ? Number(addCampaignBudget.value) : null,
      start_date: addCampaignStart.value || null,
      end_date: addCampaignEnd.value || null,
    };
    const { error } = await client.from('campaigns').insert([row]);
    if (error) {
      addCampaignStatus.textContent = 'Failed to add campaign: ' + error.message;
      return;
    }
    addCampaignStatus.textContent = `${row.name} added.`;
    addCampaignStatus.style.color = 'var(--sky)';
    addCampaignForm.reset();
    loadCampaigns();
  });

  let allMetrics = [];

  function openMetrics(campaignId) {
    currentCampaignId = campaignId;
    const c = allCampaigns.find((x) => x.id === campaignId);
    metricsCampaignName.textContent = c ? c.name : '';
    metricsSection.style.display = 'block';
    renderCampaigns();
    loadMetrics();
  }

  async function loadMetrics() {
    const { data, error } = await client
      .from('campaign_metrics')
      .select('id, date, impressions, clicks, conversions, spend, roas')
      .eq('campaign_id', currentCampaignId)
      .order('date', { ascending: false });

    if (error) {
      metricsTbody.innerHTML = '';
      metricsEmpty.style.display = 'block';
      metricsEmpty.textContent = 'Could not load metrics: ' + error.message;
      metricsSummary.innerHTML = '';
      return;
    }

    allMetrics = data || [];
    renderMetrics();
  }

  function renderMetrics() {
    const totals = allMetrics.reduce((acc, m) => {
      acc.spend += Number(m.spend) || 0;
      acc.conversions += Number(m.conversions) || 0;
      acc.clicks += Number(m.clicks) || 0;
      return acc;
    }, { spend: 0, conversions: 0, clicks: 0 });
    const roasValues = allMetrics.map((m) => Number(m.roas)).filter((n) => !isNaN(n));
    const avgRoas = roasValues.length ? (roasValues.reduce((a, b) => a + b, 0) / roasValues.length) : null;

    metricsSummary.innerHTML = [
      { label: 'Total Spend', num: formatMoney(totals.spend) },
      { label: 'Total Conversions', num: totals.conversions },
      { label: 'Avg ROAS', num: avgRoas == null ? '—' : avgRoas.toFixed(2) + 'x' },
    ].map((c) => `
      <div class="admin-stat-card">
        <div class="admin-stat-num">${c.num}</div>
        <div class="admin-stat-label">${c.label}</div>
      </div>
    `).join('');

    if (!allMetrics.length) {
      metricsTbody.innerHTML = '';
      metricsEmpty.style.display = 'block';
      metricsEmpty.textContent = 'No metrics yet — add a row above.';
      return;
    }

    metricsEmpty.style.display = 'none';
    metricsTbody.innerHTML = allMetrics.map((m) => `
        <tr>
          <td>${new Date(m.date).toLocaleDateString()}</td>
          <td>${m.impressions == null ? '—' : m.impressions.toLocaleString()}</td>
          <td>${m.clicks == null ? '—' : m.clicks.toLocaleString()}</td>
          <td>${m.conversions == null ? '—' : m.conversions.toLocaleString()}</td>
          <td>${formatMoney(m.spend)}</td>
          <td>${m.roas == null ? '—' : Number(m.roas).toFixed(2) + 'x'}</td>
        </tr>
      `).join('');
  }

  addMetricForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addMetricStatus.textContent = '';
    const row = {
      campaign_id: currentCampaignId,
      date: addMetricDate.value,
      impressions: addMetricImpressions.value ? Number(addMetricImpressions.value) : 0,
      clicks: addMetricClicks.value ? Number(addMetricClicks.value) : 0,
      conversions: addMetricConversions.value ? Number(addMetricConversions.value) : 0,
      spend: addMetricSpend.value ? Number(addMetricSpend.value) : 0,
      roas: addMetricRoas.value ? Number(addMetricRoas.value) : null,
    };
    const { error } = await client.from('campaign_metrics').upsert([row], { onConflict: 'campaign_id,date' });
    if (error) {
      addMetricStatus.textContent = 'Failed to add metric row: ' + error.message;
      return;
    }
    addMetricStatus.textContent = `Metrics for ${row.date} saved.`;
    addMetricStatus.style.color = 'var(--sky)';
    addMetricForm.reset();
    loadMetrics();
  });

  updateAuthUI();

  (async function checkSession() {
    const { data: { session } } = await client.auth.getSession();
    afterAuth(session);
  })();
})();
