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
  const addClientEmail = document.getElementById('add-client-email');
  const addClientStatus = document.getElementById('add-client-status');

  const clientsListView = document.getElementById('clients-list-view');
  const clientDetailView = document.getElementById('client-detail-view');
  const clientDetailName = document.getElementById('client-detail-name');
  const backToClientsBtn = document.getElementById('back-to-clients');

  const portalAccessStatusEl = document.getElementById('portal-access-status');
  const portalApproveBtn = document.getElementById('portal-approve-btn');
  const portalRevokeBtn = document.getElementById('portal-revoke-btn');
  const revokeAuthorizationBtn = document.getElementById('revoke-authorization-btn');
  const authorizedEmailForm = document.getElementById('authorized-email-form');
  const authorizedEmailInput = document.getElementById('authorized-email-input');
  const authorizedEmailStatus = document.getElementById('authorized-email-status');

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

  const invoicesSummary = document.getElementById('invoices-summary');
  const invoicesTbody = document.getElementById('invoices-tbody');
  const invoicesEmpty = document.getElementById('invoices-empty');
  const addInvoiceForm = document.getElementById('add-invoice-form');
  const addInvoiceAmount = document.getElementById('add-invoice-amount');
  const addInvoiceDue = document.getElementById('add-invoice-due');
  const addInvoiceStatusSelect = document.getElementById('add-invoice-status');
  const addInvoiceStatusMsg = document.getElementById('add-invoice-status-msg');

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

  const creatorsTbody = document.getElementById('creators-tbody');
  const creatorsEmpty = document.getElementById('creators-empty');
  const addCreatorForm = document.getElementById('add-creator-form');
  const addCreatorName = document.getElementById('add-creator-name');
  const addCreatorEmail = document.getElementById('add-creator-email');
  const addCreatorNiche = document.getElementById('add-creator-niche');
  const addCreatorRate = document.getElementById('add-creator-rate');
  const addCreatorPortfolio = document.getElementById('add-creator-portfolio');
  const addCreatorStatus = document.getElementById('add-creator-status');

  const briefsTbody = document.getElementById('briefs-tbody');
  const briefsEmpty = document.getElementById('briefs-empty');
  const addBriefForm = document.getElementById('add-brief-form');
  const addBriefTitle = document.getElementById('add-brief-title');
  const addBriefTalkingPoints = document.getElementById('add-brief-talking-points');
  const addBriefDeadline = document.getElementById('add-brief-deadline');
  const addBriefDescription = document.getElementById('add-brief-description');
  const addBriefStatus = document.getElementById('add-brief-status');

  const submissionsSection = document.getElementById('submissions-section');
  const submissionsBriefTitle = document.getElementById('submissions-brief-title');
  const submissionsBriefDescription = document.getElementById('submissions-brief-description');
  const submissionsTbody = document.getElementById('submissions-tbody');
  const submissionsEmpty = document.getElementById('submissions-empty');
  const addSubmissionForm = document.getElementById('add-submission-form');
  const addSubmissionCreator = document.getElementById('add-submission-creator');
  const addSubmissionType = document.getElementById('add-submission-type');
  const addSubmissionUrl = document.getElementById('add-submission-url');
  const addSubmissionStatus = document.getElementById('add-submission-status');

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
      loadCreators();
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
  let currentBriefId = null;

  async function loadClients() {
    const { data: clientRows, error: clientErr } = await client
      .from('clients')
      .select('id, company_name, status, user_id, portal_approved')
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

  const CLIENT_STATUSES = ['active', 'paused', 'churned'];

  function renderClients(clients) {
    if (!clients.length) {
      clientsTbody.innerHTML = '';
      clientsEmpty.style.display = 'block';
      clientsEmpty.textContent = 'No clients yet — add one above.';
      return;
    }

    clientsEmpty.style.display = 'none';
    clientsTbody.innerHTML = clients.map((c) => {
      const portalCls = !c.user_id ? 'no-signup' : (c.portal_approved ? 'approved' : 'pending');
      const portalLabel = !c.user_id ? 'Not signed up' : (c.portal_approved ? 'Approved' : 'Pending');
      return `
        <tr>
          <td>${escapeHtml(c.company_name)}</td>
          <td>
            <select class="status-select ${c.status}" data-client-id="${c.id}">
              ${CLIENT_STATUSES.map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td><span class="status-select ${portalCls}">${portalLabel}</span></td>
          <td><button type="button" class="btn btn-ghost clients-manage-btn" data-client-id="${c.id}">Manage</button></td>
        </tr>
      `;
    }).join('');

    clientsTbody.querySelectorAll('.clients-manage-btn').forEach((btn) => {
      btn.addEventListener('click', () => openClientDetail(btn.dataset.clientId));
    });

    clientsTbody.querySelectorAll('select.status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.clientId;
        const status = e.target.value;
        const { error } = await client.from('clients').update({ status }).eq('id', id);
        if (error) {
          alert('Failed to update status: ' + error.message);
          return;
        }
        const c = allClients.find((x) => x.id === id);
        if (c) c.status = status;
        e.target.className = 'status-select ' + status;
      });
    });
  }

  addClientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addClientStatus.textContent = '';
    const companyName = addClientName.value.trim();
    const authorizedEmail = addClientEmail.value.trim().toLowerCase() || null;
    const { error } = await client.from('clients').insert([{ company_name: companyName, authorized_email: authorizedEmail }]);
    if (error) {
      addClientStatus.textContent = error.message.includes('duplicate')
        ? 'That email is already authorized for another client.'
        : 'Failed to add client: ' + error.message;
      return;
    }
    addClientStatus.textContent = `${companyName} added.`;
    addClientStatus.style.color = 'var(--sky)';
    addClientForm.reset();
    loadClients();
  });

  let allCreators = [];

  async function loadCreators() {
    const { data, error } = await client
      .from('ugc_creators')
      .select('id, niche, rate_per_video, portfolio_url, availability, users(name, email)')
      .order('id', { ascending: true });

    if (error) {
      creatorsTbody.innerHTML = '';
      creatorsEmpty.style.display = 'block';
      creatorsEmpty.textContent = 'Could not load creators: ' + error.message;
      return;
    }

    allCreators = data || [];
    renderCreators();
    renderSubmissionCreatorOptions();
  }

  function renderCreators() {
    if (!allCreators.length) {
      creatorsTbody.innerHTML = '';
      creatorsEmpty.style.display = 'block';
      creatorsEmpty.textContent = 'No creators yet — add one above.';
      return;
    }

    creatorsEmpty.style.display = 'none';
    creatorsTbody.innerHTML = allCreators.map((c) => `
        <tr>
          <td>${escapeHtml(c.users ? c.users.name || c.users.email : '—')}</td>
          <td>${escapeHtml((c.niche || []).join(', ') || '—')}</td>
          <td>${formatMoney(c.rate_per_video)}</td>
          <td>${c.portfolio_url ? `<a href="${escapeHtml(c.portfolio_url)}" target="_blank" rel="noopener" style="color:var(--sky);">Link</a>` : '—'}</td>
          <td><button type="button" class="status-select ${c.availability ? 'available' : 'unavailable'}" data-creator-id="${c.id}">${c.availability ? 'Available' : 'Unavailable'}</button></td>
        </tr>
      `).join('');

    creatorsTbody.querySelectorAll('button.status-select').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.creatorId;
        const creator = allCreators.find((c) => c.id === id);
        if (!creator) return;
        const newAvailability = !creator.availability;
        const { error } = await client.from('ugc_creators').update({ availability: newAvailability }).eq('id', id);
        if (error) {
          alert('Failed to update availability: ' + error.message);
          return;
        }
        creator.availability = newAvailability;
        renderCreators();
      });
    });
  }

  addCreatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addCreatorStatus.textContent = '';
    const name = addCreatorName.value.trim();
    const email = addCreatorEmail.value.trim();
    const { data: userRow, error: userErr } = await client
      .from('users')
      .insert([{ name, email, role: 'creator' }])
      .select('id')
      .single();
    if (userErr) {
      addCreatorStatus.textContent = userErr.message.includes('duplicate') ? 'That email is already in use.' : 'Failed to add creator: ' + userErr.message;
      return;
    }
    const niche = addCreatorNiche.value.split(',').map((s) => s.trim()).filter(Boolean);
    const { error: creatorErr } = await client.from('ugc_creators').insert([{
      user_id: userRow.id,
      niche: niche.length ? niche : null,
      rate_per_video: addCreatorRate.value ? Number(addCreatorRate.value) : null,
      portfolio_url: addCreatorPortfolio.value.trim() || null,
      availability: true,
    }]);
    if (creatorErr) {
      addCreatorStatus.textContent = 'Failed to add creator: ' + creatorErr.message;
      return;
    }
    addCreatorStatus.textContent = `${name} added.`;
    addCreatorStatus.style.color = 'var(--sky)';
    addCreatorForm.reset();
    loadCreators();
  });

  function openClientDetail(clientId, opts = {}) {
    const clientRow = allClients.find((c) => c.id === clientId);
    if (!clientRow) return;
    currentClientId = clientId;
    currentCampaignId = null;
    currentBriefId = null;
    clientDetailName.textContent = clientRow.company_name;
    metricsSection.style.display = 'none';
    submissionsSection.style.display = 'none';
    clientsListView.style.display = 'none';
    clientDetailView.style.display = 'block';
    loadCampaigns();
    loadInvoices();
    loadContentBriefs();
    loadPortalAccessStatus();
    if (!opts.skipPush) {
      history.pushState({ tab: 'clients', view: 'client-detail', clientId }, '');
    }
  }

  function closeClientDetailView() {
    currentClientId = null;
    currentCampaignId = null;
    currentBriefId = null;
    clientDetailView.style.display = 'none';
    clientsListView.style.display = 'block';
  }

  backToClientsBtn.addEventListener('click', () => {
    history.back();
  });

  async function loadPortalAccessStatus() {
    authorizedEmailStatus.textContent = '';
    const { data, error } = await client
      .from('clients')
      .select('user_id, portal_approved, authorized_email, users(email)')
      .eq('id', currentClientId)
      .maybeSingle();
    if (error || !data) {
      portalAccessStatusEl.textContent = '';
      portalApproveBtn.style.display = 'none';
      portalRevokeBtn.style.display = 'none';
      revokeAuthorizationBtn.style.display = 'none';
      authorizedEmailForm.style.display = 'none';
      return;
    }
    if (!data.user_id) {
      portalApproveBtn.style.display = 'none';
      portalRevokeBtn.style.display = 'none';
      if (data.authorized_email) {
        portalAccessStatusEl.textContent = `No signup yet — instant access authorized for ${data.authorized_email}.`;
        authorizedEmailForm.style.display = 'none';
        revokeAuthorizationBtn.style.display = 'inline-flex';
      } else {
        portalAccessStatusEl.textContent = 'No signup yet. Optionally authorize an email below for instant access.';
        authorizedEmailForm.style.display = 'flex';
        authorizedEmailInput.value = '';
        revokeAuthorizationBtn.style.display = 'none';
      }
    } else if (!data.portal_approved) {
      portalAccessStatusEl.textContent = `Pending approval — signed up as ${data.users ? data.users.email : 'unknown'}.`;
      portalApproveBtn.style.display = 'inline-flex';
      portalRevokeBtn.style.display = 'none';
      revokeAuthorizationBtn.style.display = 'none';
      authorizedEmailForm.style.display = 'none';
    } else {
      portalAccessStatusEl.textContent = `Approved — ${data.users ? data.users.email : 'unknown'} can sign in.`;
      portalApproveBtn.style.display = 'none';
      portalRevokeBtn.style.display = 'inline-flex';
      revokeAuthorizationBtn.style.display = 'none';
      authorizedEmailForm.style.display = 'none';
    }
  }

  authorizedEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authorizedEmailStatus.textContent = '';
    const email = authorizedEmailInput.value.trim().toLowerCase() || null;
    const { error } = await client.from('clients').update({ authorized_email: email }).eq('id', currentClientId);
    if (error) {
      authorizedEmailStatus.textContent = error.message.includes('duplicate')
        ? 'That email is already authorized for another client.'
        : 'Failed to save: ' + error.message;
      return;
    }
    authorizedEmailStatus.textContent = email
      ? `Saved — ${email} has been granted client portal access. They'll get in as soon as they sign up (or sign in, if they already have an account) with that email.`
      : 'Cleared — that email no longer has pre-authorized access.';
    authorizedEmailStatus.style.color = 'var(--sky)';
    loadPortalAccessStatus();
  });

  revokeAuthorizationBtn.addEventListener('click', async () => {
    authorizedEmailStatus.textContent = '';
    const { error } = await client.from('clients').update({ authorized_email: null }).eq('id', currentClientId);
    if (error) {
      authorizedEmailStatus.textContent = 'Failed to revoke: ' + error.message;
      return;
    }
    authorizedEmailStatus.textContent = 'Authorization revoked.';
    authorizedEmailStatus.style.color = 'var(--sky)';
    loadPortalAccessStatus();
  });

  portalApproveBtn.addEventListener('click', async () => {
    const { error } = await client.from('clients').update({ portal_approved: true }).eq('id', currentClientId);
    if (error) {
      alert('Failed to approve portal access: ' + error.message);
      return;
    }
    loadPortalAccessStatus();
    loadClients();
  });

  portalRevokeBtn.addEventListener('click', async () => {
    if (!confirm('Revoke portal access for this client? They will be signed out of the dashboard until re-approved.')) return;
    const { error } = await client.from('clients').update({ portal_approved: false }).eq('id', currentClientId);
    if (error) {
      alert('Failed to revoke portal access: ' + error.message);
      return;
    }
    loadPortalAccessStatus();
    loadClients();
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

  // Postgres `date` columns come back as plain "YYYY-MM-DD" strings with no
  // time or zone info. `new Date("YYYY-MM-DD")` parses that as UTC midnight,
  // so toLocaleDateString() in a timezone behind UTC renders the day before
  // -- construct the Date from the local Y/M/D components instead.
  function formatDateOnly(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString();
  }

  function formatDateRange(start, end) {
    if (!start && !end) return '—';
    return `${start ? formatDateOnly(start) : '…'} – ${end ? formatDateOnly(end) : '…'}`;
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

  let allInvoices = [];
  const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];

  async function loadInvoices() {
    const { data, error } = await client
      .from('invoices')
      .select('id, amount, status, due_date')
      .eq('client_id', currentClientId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      invoicesTbody.innerHTML = '';
      invoicesEmpty.style.display = 'block';
      invoicesEmpty.textContent = 'Could not load invoices: ' + error.message;
      invoicesSummary.innerHTML = '';
      return;
    }

    allInvoices = data || [];
    renderInvoices();
  }

  function renderInvoices() {
    const totals = allInvoices.reduce((acc, inv) => {
      const amt = Number(inv.amount) || 0;
      acc.total += amt;
      if (inv.status === 'paid') acc.paid += amt;
      if (inv.status === 'sent' || inv.status === 'overdue') acc.outstanding += amt;
      return acc;
    }, { total: 0, paid: 0, outstanding: 0 });

    invoicesSummary.innerHTML = [
      { label: 'Total Invoiced', num: formatMoney(totals.total) },
      { label: 'Total Paid', num: formatMoney(totals.paid) },
      { label: 'Outstanding', num: formatMoney(totals.outstanding) },
    ].map((c) => `
      <div class="admin-stat-card">
        <div class="admin-stat-num">${c.num}</div>
        <div class="admin-stat-label">${c.label}</div>
      </div>
    `).join('');

    if (!allInvoices.length) {
      invoicesTbody.innerHTML = '';
      invoicesEmpty.style.display = 'block';
      invoicesEmpty.textContent = 'No invoices yet — add one above.';
      return;
    }

    invoicesEmpty.style.display = 'none';
    invoicesTbody.innerHTML = allInvoices.map((inv) => `
        <tr>
          <td>${formatMoney(inv.amount)}</td>
          <td>${formatDateOnly(inv.due_date)}</td>
          <td>
            <select class="status-select ${inv.status}" data-invoice-id="${inv.id}">
              ${INVOICE_STATUSES.map((s) => `<option value="${s}" ${s === inv.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>
      `).join('');

    invoicesTbody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.invoiceId;
        const status = e.target.value;
        const { error } = await client.from('invoices').update({ status }).eq('id', id);
        if (error) {
          alert('Failed to update status: ' + error.message);
          return;
        }
        const inv = allInvoices.find((x) => x.id === id);
        if (inv) inv.status = status;
        e.target.className = 'status-select ' + status;
        renderInvoices();
      });
    });
  }

  addInvoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addInvoiceStatusMsg.textContent = '';
    const row = {
      client_id: currentClientId,
      amount: Number(addInvoiceAmount.value),
      due_date: addInvoiceDue.value || null,
      status: addInvoiceStatusSelect.value,
    };
    const { error } = await client.from('invoices').insert([row]);
    if (error) {
      addInvoiceStatusMsg.textContent = 'Failed to add invoice: ' + error.message;
      return;
    }
    addInvoiceStatusMsg.textContent = `Invoice for ${formatMoney(row.amount)} added.`;
    addInvoiceStatusMsg.style.color = 'var(--sky)';
    addInvoiceForm.reset();
    loadInvoices();
  });

  let allBriefs = [];

  async function loadContentBriefs() {
    const { data, error } = await client
      .from('content_briefs')
      .select('id, title, description, talking_points, deadline')
      .eq('client_id', currentClientId)
      .order('deadline', { ascending: true, nullsFirst: false });

    if (error) {
      briefsTbody.innerHTML = '';
      briefsEmpty.style.display = 'block';
      briefsEmpty.textContent = 'Could not load content briefs: ' + error.message;
      return;
    }

    allBriefs = data || [];
    renderContentBriefs();
  }

  function renderContentBriefs() {
    if (!allBriefs.length) {
      briefsTbody.innerHTML = '';
      briefsEmpty.style.display = 'block';
      briefsEmpty.textContent = 'No content briefs yet — add one above.';
      return;
    }

    briefsEmpty.style.display = 'none';
    briefsTbody.innerHTML = allBriefs.map((b) => `
        <tr class="brief-row ${b.id === currentBriefId ? 'active-row' : ''}" data-brief-id="${b.id}">
          <td>${escapeHtml(b.title)}</td>
          <td>${escapeHtml((b.talking_points || []).join(', ') || '—')}</td>
          <td>${formatDateOnly(b.deadline)}</td>
        </tr>
      `).join('');

    briefsTbody.querySelectorAll('.brief-row').forEach((row) => {
      row.addEventListener('click', () => openSubmissions(row.dataset.briefId));
    });
  }

  addBriefForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addBriefStatus.textContent = '';
    const talkingPoints = addBriefTalkingPoints.value.split(',').map((s) => s.trim()).filter(Boolean);
    const row = {
      client_id: currentClientId,
      title: addBriefTitle.value.trim(),
      description: addBriefDescription.value.trim() || null,
      talking_points: talkingPoints.length ? talkingPoints : null,
      deadline: addBriefDeadline.value || null,
    };
    const { error } = await client.from('content_briefs').insert([row]);
    if (error) {
      addBriefStatus.textContent = 'Failed to add brief: ' + error.message;
      return;
    }
    addBriefStatus.textContent = `${row.title} added.`;
    addBriefStatus.style.color = 'var(--sky)';
    addBriefForm.reset();
    loadContentBriefs();
  });

  let allSubmissions = [];
  const UGC_STATUSES = ['submitted', 'approved', 'rejected', 'revision'];

  function renderSubmissionCreatorOptions() {
    addSubmissionCreator.innerHTML = '<option value="">Creator</option>' + allCreators.map((c) =>
      `<option value="${c.id}">${escapeHtml(c.users ? c.users.name || c.users.email : 'Unnamed')}</option>`
    ).join('');
  }

  function openSubmissions(briefId) {
    currentBriefId = briefId;
    const b = allBriefs.find((x) => x.id === briefId);
    submissionsBriefTitle.textContent = b ? b.title : '';
    submissionsBriefDescription.textContent = b && b.description ? b.description : '';
    submissionsSection.style.display = 'block';
    renderContentBriefs();
    loadSubmissions();
  }

  async function loadSubmissions() {
    const { data, error } = await client
      .from('ugc_content')
      .select('id, type, file_url, status, creator_id, ugc_creators(users(name, email))')
      .eq('brief_id', currentBriefId)
      .order('id', { ascending: true });

    if (error) {
      submissionsTbody.innerHTML = '';
      submissionsEmpty.style.display = 'block';
      submissionsEmpty.textContent = 'Could not load submissions: ' + error.message;
      return;
    }

    allSubmissions = data || [];
    renderSubmissions();
  }

  function renderSubmissions() {
    if (!allSubmissions.length) {
      submissionsTbody.innerHTML = '';
      submissionsEmpty.style.display = 'block';
      submissionsEmpty.textContent = 'No submissions yet — add one above.';
      return;
    }

    submissionsEmpty.style.display = 'none';
    submissionsTbody.innerHTML = allSubmissions.map((s) => {
      const creatorName = s.ugc_creators && s.ugc_creators.users ? (s.ugc_creators.users.name || s.ugc_creators.users.email) : '—';
      return `
        <tr>
          <td>${escapeHtml(creatorName)}</td>
          <td>${escapeHtml(s.type)}</td>
          <td>${s.file_url ? `<a href="${escapeHtml(s.file_url)}" target="_blank" rel="noopener" style="color:var(--sky);">File</a>` : '—'}</td>
          <td>
            <select class="status-select ${s.status}" data-submission-id="${s.id}">
              ${UGC_STATUSES.map((st) => `<option value="${st}" ${st === s.status ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </td>
        </tr>
      `;
    }).join('');

    submissionsTbody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.submissionId;
        const status = e.target.value;
        const { error } = await client.from('ugc_content').update({ status }).eq('id', id);
        if (error) {
          alert('Failed to update status: ' + error.message);
          return;
        }
        const s = allSubmissions.find((x) => x.id === id);
        if (s) s.status = status;
        e.target.className = 'status-select ' + status;
      });
    });
  }

  addSubmissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addSubmissionStatus.textContent = '';
    if (!addSubmissionCreator.value) {
      addSubmissionStatus.textContent = 'Pick a creator first.';
      return;
    }
    const row = {
      client_id: currentClientId,
      brief_id: currentBriefId,
      creator_id: addSubmissionCreator.value,
      type: addSubmissionType.value,
      file_url: addSubmissionUrl.value.trim() || null,
    };
    const { error } = await client.from('ugc_content').insert([row]);
    if (error) {
      addSubmissionStatus.textContent = 'Failed to add submission: ' + error.message;
      return;
    }
    addSubmissionStatus.textContent = 'Submission added.';
    addSubmissionStatus.style.color = 'var(--sky)';
    addSubmissionForm.reset();
    loadSubmissions();
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
          <td>${formatDateOnly(m.date)}</td>
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
