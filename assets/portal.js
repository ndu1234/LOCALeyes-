(function () {
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const loginScreen = document.getElementById('portal-login');
  const resetScreen = document.getElementById('portal-reset');
  const pendingScreen = document.getElementById('portal-pending');
  const noAccessScreen = document.getElementById('portal-no-access');
  const dashboard = document.getElementById('portal-dashboard');

  const loginForm = document.getElementById('portal-login-form');
  const authSub = document.getElementById('portal-auth-sub');
  const authSubmitBtn = document.getElementById('portal-login-submit');
  const toggleModeLink = document.getElementById('portal-toggle-mode');
  const signupCompanyGroup = document.getElementById('portal-signup-company-group');
  const signupCompanyInput = document.getElementById('portal-signup-company');
  const signupNameGroup = document.getElementById('portal-signup-name-group');
  const signupNameInput = document.getElementById('portal-signup-name');
  const loginEmailInput = document.getElementById('portal-login-email');
  const loginPasswordInput = document.getElementById('portal-login-password');
  const loginError = document.getElementById('portal-login-error');
  const forgotPasswordWrap = document.getElementById('portal-forgot-password-wrap');
  const forgotPasswordLink = document.getElementById('portal-forgot-password-link');
  const resetForm = document.getElementById('portal-reset-form');
  const resetPasswordInput = document.getElementById('portal-reset-password');
  const resetError = document.getElementById('portal-reset-error');

  const pendingCompanyEl = document.getElementById('portal-pending-company');
  const pendingLogoutBtn = document.getElementById('pending-logout-btn');
  const noAccessLogoutBtn = document.getElementById('no-access-logout-btn');
  const logoutBtn = document.getElementById('portal-logout-btn');
  const companyNameEl = document.getElementById('portal-company-name');

  let mode = 'signin'; // 'signin' | 'signup'
  let recoveryMode = false; // true while the user arrived via a password-recovery email link

  function updateAuthUI() {
    signupCompanyGroup.style.display = mode === 'signup' ? 'block' : 'none';
    signupNameGroup.style.display = mode === 'signup' ? 'block' : 'none';
    signupCompanyInput.required = mode === 'signup';
    signupNameInput.required = mode === 'signup';
    loginPasswordInput.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    forgotPasswordWrap.style.display = mode === 'signup' ? 'none' : 'flex';
    if (mode === 'signup') {
      authSub.textContent = 'Tell us about your company to request portal access.';
      authSubmitBtn.textContent = 'Request Access';
      toggleModeLink.textContent = 'Already have an account? Sign in';
    } else {
      authSub.textContent = 'Sign in to your account.';
      authSubmitBtn.textContent = 'Sign In';
      toggleModeLink.textContent = 'Need an account? Request access';
    }
  }

  toggleModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'signup' ? 'signin' : 'signup';
    loginError.textContent = '';
    updateAuthUI();
  });

  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value.trim();
    if (!email) {
      loginError.textContent = 'Enter your email above first, then click "Forgot password?"';
      return;
    }
    loginError.textContent = 'Sending…';
    loginError.style.color = 'var(--sky)';
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) {
      loginError.textContent = error.message;
      loginError.style.color = '';
      return;
    }
    // Deliberately worded not to confirm whether the email has an account --
    // avoids leaking account existence to whoever is at this form.
    loginError.textContent = 'If an account exists for that email, a reset link is on its way.';
    loginError.style.color = 'var(--sky)';
  });

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetError.textContent = '';
    const password = resetPasswordInput.value;
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

  const campaignsTbody = document.getElementById('portal-campaigns-tbody');
  const campaignsEmpty = document.getElementById('portal-campaigns-empty');
  const metricsSection = document.getElementById('portal-metrics-section');
  const metricsCampaignName = document.getElementById('portal-metrics-campaign-name');
  const metricsSummary = document.getElementById('portal-metrics-summary');
  const metricsTbody = document.getElementById('portal-metrics-tbody');
  const metricsEmpty = document.getElementById('portal-metrics-empty');
  const metricsChart = document.getElementById('portal-metrics-chart');

  const invoicesSummary = document.getElementById('portal-invoices-summary');
  const invoicesTbody = document.getElementById('portal-invoices-tbody');
  const invoicesEmpty = document.getElementById('portal-invoices-empty');

  const briefsTbody = document.getElementById('portal-briefs-tbody');
  const briefsEmpty = document.getElementById('portal-briefs-empty');
  const submissionsSection = document.getElementById('portal-submissions-section');
  const submissionsBriefTitle = document.getElementById('portal-submissions-brief-title');
  const submissionsBriefDescription = document.getElementById('portal-submissions-brief-description');
  const submissionsTbody = document.getElementById('portal-submissions-tbody');
  const submissionsEmpty = document.getElementById('portal-submissions-empty');

  let currentClientId = null;
  let allCampaigns = [];
  let allBriefs = [];
  let currentBriefId = null;
  const UGC_STATUSES = ['submitted', 'approved', 'rejected', 'revision'];

  function showScreen(screen) {
    loginScreen.style.display = screen === 'login' ? 'flex' : 'none';
    resetScreen.style.display = screen === 'reset' ? 'flex' : 'none';
    pendingScreen.style.display = screen === 'pending' ? 'flex' : 'none';
    noAccessScreen.style.display = screen === 'no-access' ? 'flex' : 'none';
    dashboard.style.display = screen === 'dashboard' ? 'flex' : 'none';
  }

  function escapeHtml(str) {
    // innerHTML round-tripping escapes & < > but NOT quotes -- and this
    // helper is used inside attribute values (href="...", value="..."),
    // where an embedded " would terminate the attribute and let the rest
    // of the string inject new ones. Escape all five metacharacters.
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMoney(n) {
    if (n == null) return '—';
    const num = Number(n);
    // Whole-dollar amounts stay clean ($2,500); anything with cents gets the
    // full two digits ($900.50, not $900.5).
    return '$' + num.toLocaleString(undefined, {
      minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  // Postgres `date` columns come back as "YYYY-MM-DD" with no time/zone --
  // new Date() on that parses as UTC midnight, which renders a day early in
  // timezones behind UTC. Build the Date from the local Y/M/D components.
  function formatDateOnly(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString();
  }

  function formatDateRange(start, end) {
    if (!start && !end) return '—';
    return `${start ? formatDateOnly(start) : '…'} – ${end ? formatDateOnly(end) : '…'}`;
  }

  // Campaigns store the admin platform picker's lowercase value ("tiktok");
  // show the human label instead of the raw stored token.
  const PLATFORM_LABELS = { meta: 'Meta', google: 'Google', tiktok: 'TikTok', youtube: 'YouTube' };
  function formatPlatform(p) {
    return p ? (PLATFORM_LABELS[p] || p) : '—';
  }

  // ROAS trend across a campaign's daily metrics, oldest to newest. Same visual
  // language as the admin dashboard's area chart (gradient fill, glowing
  // endpoint), but built from real dated rows rather than a fixed day-bucket
  // window, since a campaign can have any number of metric rows.
  function renderRoasTrend(el, metrics) {
    const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    const points = sorted.map((m) => Number(m.roas)).filter((n) => !isNaN(n));
    if (points.length < 2) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';

    const viewH = 40;
    const max = Math.max(0.01, ...points);
    const n = points.length;
    const coords = points.map((v, i) => ({
      x: n === 1 ? 0 : (i / (n - 1)) * 100,
      y: viewH - (v / max) * (viewH - 4) - 2,
    }));
    const gradId = 'portalRoas-' + Math.random().toString(36).slice(2);
    const line = coords.map((p) => `${p.x},${p.y.toFixed(2)}`).join(' ');
    const area = `0,${viewH} ${line} 100,${viewH}`;
    const last = coords[coords.length - 1];

    const firstDated = sorted[0], lastDated = sorted[sorted.length - 1];
    el.innerHTML = `
      <div class="portal-metrics-chart-title">ROAS trend</div>
      <div class="area-chart-svg">
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
        <div class="area-chart-endpoint" style="left:${last.x}%; top:${(last.y / viewH) * 100}%"></div>
      </div>
      <div class="area-chart-labels">
        <span style="text-align:left;">${escapeHtml(formatDateOnly(firstDated.date))}</span>
        <span style="text-align:right;">${escapeHtml(formatDateOnly(lastDated.date))}</span>
      </div>
    `;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = loginEmailInput.value.trim().toLowerCase();
    const password = loginPasswordInput.value;

    if (mode === 'signup') {
      const companyName = signupCompanyInput.value.trim();
      const contactName = signupNameInput.value.trim();
      // Company/contact name can't be written to our tables yet -- there's
      // no session until the email is confirmed, and RLS requires an
      // authenticated JWT for the self-insert. Stashed as auth user
      // metadata instead, so afterAuth() can read it back and finish
      // provisioning the account once they return with a confirmed session.
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { company_name: companyName, contact_name: contactName } },
      });
      if (error) {
        loginError.textContent = error.message;
        return;
      }
      if (!data.session) {
        loginError.textContent = 'Check your email to confirm your account, then sign in.';
        loginError.style.color = 'var(--sky)';
        mode = 'signin';
        updateAuthUI();
        return;
      }
      afterAuth(data.session);
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      // Supabase returns the same error whether the password is wrong or no
      // account exists at all -- an admin authorizing an email doesn't
      // create a login, it only pre-approves one, so "no account yet" is a
      // common first attempt here. Point at signup rather than leaving them
      // stuck re-trying a password for an account that was never created.
      loginError.textContent = "Invalid email or password. If you don't have an account yet, use \"Request access\" below.";
      return;
    }
    afterAuth(data.session);
  });

  async function signOut() {
    await client.auth.signOut();
    // Clears drill-down state and hides nested sections so a different
    // client signing in on the same browser never sees a previous
    // session's leftover campaign/submission data flash before their
    // own loads.
    currentClientId = null;
    currentBriefId = null;
    metricsSection.style.display = 'none';
    submissionsSection.style.display = 'none';
    showScreen('login');
  }
  pendingLogoutBtn.addEventListener('click', signOut);
  noAccessLogoutBtn.addEventListener('click', signOut);
  logoutBtn.addEventListener('click', signOut);

  // Claims instant access to a client an admin pre-authorized this exact
  // email for (a client_authorized_emails row matching the caller's own
  // email) by inserting an approved client_users row. Returns
  // { client_id, portal_approved, clients: { company_name } } for the new
  // membership, or null if there's no authorization to claim. RLS scopes
  // the insert so it can only ever succeed for a client_id that actually
  // has a matching authorization for the caller's own JWT email -- see
  // "Users can request or claim client portal access" in the migration.
  async function claimAuthorizedClient(email, userId) {
    const { data: authRow } = await client
      .from('client_authorized_emails')
      .select('client_id')
      .eq('email', email)
      .maybeSingle();
    if (!authRow) return null;
    const { data, error } = await client
      .from('client_users')
      .insert([{ client_id: authRow.client_id, user_id: userId, portal_approved: true }])
      .select('client_id, portal_approved, clients(company_name)')
      .maybeSingle();
    if (error) return null;
    return data || null;
  }

  async function afterAuth(session) {
    if (recoveryMode) return; // the password-reset screen owns the UI until the password is updated
    if (!session) {
      showScreen('login');
      return;
    }
    const email = session.user.email;
    // My own client_users row, joined to the client it belongs to. A
    // *client* can have many users now, but a user still only ever
    // belongs to one client, so .maybeSingle() here is correct. RLS scopes
    // this to rows where user_id matches our own users row -- no explicit
    // filter needed, and no other client's membership can ever show up
    // here.
    let { data: membership } = await client
      .from('client_users')
      .select('client_id, portal_approved, clients(company_name)')
      .maybeSingle();

    if (!membership) {
      // No membership linked to this account yet. Two cases land here:
      // (a) an admin authorized this email for instant access after the
      // account was created, or this is just an ordinary sign-in and
      // authorization was only just granted -- check every time, not just
      // at signup, so authorization always takes effect; (b) this is a
      // signup's *first* return with a confirmed session -- our own
      // users/clients/client_users rows were never created yet (no
      // session existed at signup time to write them under), so finish
      // provisioning now using the company/contact name stashed in auth
      // user metadata at signup.
      let { data: userRow } = await client.from('users').select('id').eq('email', email).maybeSingle();
      const metadata = session.user.user_metadata || {};

      if (!userRow && metadata.company_name) {
        const { data: newUser, error: userErr } = await client
          .from('users')
          .insert([{ email, name: metadata.contact_name || null, role: 'client' }])
          .select('id')
          .single();
        if (!userErr) userRow = newUser;
      }

      if (userRow) {
        membership = await claimAuthorizedClient(email, userRow.id);
        if (!membership && metadata.company_name) {
          // Ordinary self-signup: create a brand new pending company. The
          // id is generated client-side rather than left to the database
          // default so the follow-up client_users insert doesn't need to
          // read this clients row back first -- RLS only grants SELECT on
          // a clients row once a client_users membership row exists for
          // it, which isn't true until the very next insert.
          const newClientId = crypto.randomUUID();
          const { error: clientErr } = await client
            .from('clients')
            .insert([{ id: newClientId, company_name: metadata.company_name }]);
          if (!clientErr) {
            const { data: newMembership } = await client
              .from('client_users')
              .insert([{ client_id: newClientId, user_id: userRow.id, portal_approved: false }])
              .select('client_id, portal_approved, clients(company_name)')
              .maybeSingle();
            membership = newMembership || null;
          }
        }
      }
    }

    if (!membership) {
      showScreen('no-access');
      return;
    }
    if (!membership.portal_approved) {
      pendingCompanyEl.textContent = membership.clients.company_name;
      showScreen('pending');
      return;
    }
    currentClientId = membership.client_id;
    companyNameEl.textContent = membership.clients.company_name;
    showScreen('dashboard');
    loadCampaigns();
    loadInvoices();
    loadContentBriefs();
  }

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

  function renderCampaigns() {
    if (!allCampaigns.length) {
      campaignsTbody.innerHTML = '';
      campaignsEmpty.style.display = 'block';
      campaignsEmpty.textContent = 'No campaigns yet.';
      return;
    }

    campaignsEmpty.style.display = 'none';
    campaignsTbody.innerHTML = allCampaigns.map((c) => `
        <tr class="campaign-row" data-campaign-id="${c.id}">
          <td>${escapeHtml(c.name)}</td>
          <td>${escapeHtml(formatPlatform(c.platform))}</td>
          <td>${escapeHtml(c.objective || '—')}</td>
          <td>${formatMoney(c.budget)}</td>
          <td>${formatDateRange(c.start_date, c.end_date)}</td>
          <td><span class="status-select ${c.status}">${escapeHtml(c.status)}</span></td>
        </tr>
      `).join('');

    campaignsTbody.querySelectorAll('.campaign-row').forEach((row) => {
      row.addEventListener('click', () => openMetrics(row.dataset.campaignId));
    });
  }

  async function openMetrics(campaignId) {
    const c = allCampaigns.find((x) => x.id === campaignId);
    metricsCampaignName.textContent = c ? c.name : '';
    metricsSection.style.display = 'block';

    const { data, error } = await client
      .from('campaign_metrics')
      .select('id, date, impressions, clicks, conversions, spend, roas')
      .eq('campaign_id', campaignId)
      .order('date', { ascending: false });

    if (error) {
      metricsTbody.innerHTML = '';
      metricsEmpty.style.display = 'block';
      metricsEmpty.textContent = 'Could not load metrics: ' + error.message;
      metricsSummary.innerHTML = '';
      metricsChart.style.display = 'none';
      return;
    }

    const metrics = data || [];
    renderRoasTrend(metricsChart, metrics);
    const totals = metrics.reduce((acc, m) => {
      acc.spend += Number(m.spend) || 0;
      acc.conversions += Number(m.conversions) || 0;
      return acc;
    }, { spend: 0, conversions: 0 });
    const roasValues = metrics.map((m) => Number(m.roas)).filter((n) => !isNaN(n));
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

    if (!metrics.length) {
      metricsTbody.innerHTML = '';
      metricsEmpty.style.display = 'block';
      metricsEmpty.textContent = 'No metrics yet.';
      return;
    }
    metricsEmpty.style.display = 'none';
    metricsTbody.innerHTML = metrics.map((m) => `
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

    const invoices = data || [];
    const totals = invoices.reduce((acc, inv) => {
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

    if (!invoices.length) {
      invoicesTbody.innerHTML = '';
      invoicesEmpty.style.display = 'block';
      invoicesEmpty.textContent = 'No invoices yet.';
      return;
    }
    invoicesEmpty.style.display = 'none';
    invoicesTbody.innerHTML = invoices.map((inv) => `
        <tr>
          <td>${formatMoney(inv.amount)}</td>
          <td>${formatDateOnly(inv.due_date)}</td>
          <td><span class="status-select ${inv.status}">${escapeHtml(inv.status)}</span></td>
        </tr>
      `).join('');
  }

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
      briefsEmpty.textContent = 'No content briefs yet.';
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

  function openSubmissions(briefId) {
    currentBriefId = briefId;
    const b = allBriefs.find((x) => x.id === briefId);
    submissionsBriefTitle.textContent = b ? b.title : '';
    submissionsBriefDescription.textContent = b && b.description ? b.description : '';
    submissionsSection.style.display = 'block';
    renderContentBriefs();
    loadSubmissions();
  }

  let allSubmissions = [];

  async function loadSubmissions() {
    const { data, error } = await client
      .from('ugc_content')
      .select('id, type, file_url, status, feedback')
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
      submissionsEmpty.textContent = 'No submissions yet.';
      return;
    }

    submissionsEmpty.style.display = 'none';
    submissionsTbody.innerHTML = allSubmissions.map((s) => `
        <tr>
          <td>${escapeHtml(s.type)}</td>
          <td>${s.file_url ? `<a href="${escapeHtml(s.file_url)}" target="_blank" rel="noopener" style="color:var(--sky);">File</a>` : '—'}</td>
          <td>
            <select class="status-select ${s.status}" data-submission-id="${s.id}">
              ${UGC_STATUSES.map((st) => `<option value="${st}" ${st === s.status ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </td>
          <td>
            <input class="form-input feedback-input" type="text" data-submission-id="${s.id}" placeholder="Leave feedback…" value="${escapeHtml(s.feedback || '')}" style="min-width:180px;" />
          </td>
        </tr>
      `).join('');

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

    submissionsTbody.querySelectorAll('.feedback-input').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const id = e.target.dataset.submissionId;
        const feedback = e.target.value.trim() || null;
        const { error } = await client.from('ugc_content').update({ feedback }).eq('id', id);
        if (error) {
          alert('Failed to save feedback: ' + error.message);
        }
      });
    });
  }

  updateAuthUI();

  // Highlight the sidebar quick-nav link for whichever section is in view.
  // Sections stay in the DOM (just hidden behind the login screen) until
  // afterAuth shows the dashboard, so this can be wired up once at load.
  const quicknavLinks = document.querySelectorAll('.portal-quicknav a');
  if (quicknavLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const key = entry.target.id.replace('portal-section-', '');
        quicknavLinks.forEach((a) => a.classList.toggle('active', a.dataset.quicknav === key));
      });
    }, { rootMargin: '-10% 0px -70% 0px' });
    document.querySelectorAll('[id^="portal-section-"]').forEach((el) => sectionObserver.observe(el));
  }

  (async function checkSession() {
    const { data: { session } } = await client.auth.getSession();
    afterAuth(session);
  })();
})();
