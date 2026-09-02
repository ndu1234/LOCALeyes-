(function () {
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const loginScreen = document.getElementById('portal-login');
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

  const pendingCompanyEl = document.getElementById('portal-pending-company');
  const pendingLogoutBtn = document.getElementById('pending-logout-btn');
  const noAccessLogoutBtn = document.getElementById('no-access-logout-btn');
  const logoutBtn = document.getElementById('portal-logout-btn');
  const companyNameEl = document.getElementById('portal-company-name');

  let mode = 'signin'; // 'signin' | 'signup'

  function updateAuthUI() {
    signupCompanyGroup.style.display = mode === 'signup' ? 'block' : 'none';
    signupNameGroup.style.display = mode === 'signup' ? 'block' : 'none';
    signupCompanyInput.required = mode === 'signup';
    signupNameInput.required = mode === 'signup';
    loginPasswordInput.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
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

  const campaignsTbody = document.getElementById('portal-campaigns-tbody');
  const campaignsEmpty = document.getElementById('portal-campaigns-empty');
  const metricsSection = document.getElementById('portal-metrics-section');
  const metricsCampaignName = document.getElementById('portal-metrics-campaign-name');
  const metricsSummary = document.getElementById('portal-metrics-summary');
  const metricsTbody = document.getElementById('portal-metrics-tbody');
  const metricsEmpty = document.getElementById('portal-metrics-empty');

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
    pendingScreen.style.display = screen === 'pending' ? 'flex' : 'none';
    noAccessScreen.style.display = screen === 'no-access' ? 'flex' : 'none';
    dashboard.style.display = screen === 'dashboard' ? 'flex' : 'none';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function formatMoney(n) {
    return n == null ? '—' : '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
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
    showScreen('login');
  }
  pendingLogoutBtn.addEventListener('click', signOut);
  noAccessLogoutBtn.addEventListener('click', signOut);
  logoutBtn.addEventListener('click', signOut);

  // Claims a client row an admin pre-authorized for this exact email
  // (authorized_email match, not yet linked to any user) -- instant,
  // pre-approved access. Returns the claimed row, or null if there's
  // nothing to claim. RLS scopes this so it can only ever touch a row
  // already authorized for the caller's own JWT email.
  async function claimAuthorizedClient(email, userId) {
    const { data } = await client
      .from('clients')
      .update({ user_id: userId, portal_approved: true })
      .eq('authorized_email', email)
      .is('user_id', null)
      .select('id, company_name, portal_approved')
      .maybeSingle();
    return data || null;
  }

  async function afterAuth(session) {
    if (!session) {
      showScreen('login');
      return;
    }
    const email = session.user.email;
    // Excludes rows only visible because they're an unclaimed
    // pre-authorization (see the "pre-authorized client row" SELECT
    // policy) -- this must only match a row actually linked to this
    // account, or an unclaimed row would short-circuit past the claim
    // attempt below and get stuck showing as if it were already "theirs"
    // without ever actually being claimed.
    let { data } = await client.from('clients').select('id, company_name, portal_approved').not('user_id', 'is', null).maybeSingle();

    if (!data) {
      // No client linked to this account yet. Two cases land here: (a) an
      // admin authorized this email for instant access after the account
      // was created, or this is just an ordinary sign-in and access was
      // only just granted -- check every time, not just at signup, so
      // authorization always takes effect; (b) this is a signup's *first*
      // return with a confirmed session -- our own users/clients rows were
      // never created yet (no session existed at signup time to write them
      // under), so finish provisioning now using the company/contact name
      // stashed in auth user metadata at signup.
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
        data = await claimAuthorizedClient(email, userRow.id);
        if (!data && metadata.company_name) {
          const { data: newClient } = await client
            .from('clients')
            .insert([{ company_name: metadata.company_name, user_id: userRow.id }])
            .select('id, company_name, portal_approved')
            .maybeSingle();
          data = newClient || null;
        }
      }
    }

    if (!data) {
      showScreen('no-access');
      return;
    }
    if (!data.portal_approved) {
      pendingCompanyEl.textContent = data.company_name;
      showScreen('pending');
      return;
    }
    currentClientId = data.id;
    companyNameEl.textContent = data.company_name;
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
          <td>${escapeHtml(c.platform || '—')}</td>
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
      return;
    }

    const metrics = data || [];
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

  (async function checkSession() {
    const { data: { session } } = await client.auth.getSession();
    afterAuth(session);
  })();
})();
