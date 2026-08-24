(function () {
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const loginScreen = document.getElementById('admin-login');
  const pendingScreen = document.getElementById('admin-pending');
  const dashboard = document.getElementById('admin-dashboard');

  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const authSub = document.getElementById('auth-sub');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const toggleModeLink = document.getElementById('toggle-mode');

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

  const adminNavItems = document.querySelectorAll('.admin-nav-item');
  const adminTabPanels = document.querySelectorAll('.admin-tab-panel');
  adminNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      adminNavItems.forEach((t) => t.classList.toggle('active', t === item));
      adminTabPanels.forEach((p) => p.classList.toggle('active', p.dataset.panel === item.dataset.tab));
    });
  });

  let allLeads = [];
  let signupMode = false;

  function showScreen(screen) {
    loginScreen.style.display = screen === 'login' ? 'flex' : 'none';
    pendingScreen.style.display = screen === 'pending' ? 'flex' : 'none';
    dashboard.style.display = screen === 'dashboard' ? 'flex' : 'none';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  toggleModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupMode = !signupMode;
    authSub.textContent = signupMode ? 'Create an account, then ask an existing admin to approve it.' : 'Sign in to view and manage leads.';
    authSubmitBtn.textContent = signupMode ? 'Create Account' : 'Sign In';
    toggleModeLink.textContent = signupMode ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    loginError.textContent = '';
  });

  async function isApprovedAdmin(email) {
    const { data } = await client.from('admins').select('email').eq('email', email).maybeSingle();
    return !!data;
  }

  async function afterAuth(session) {
    if (!session) {
      showScreen('login');
      return;
    }
    const approved = await isApprovedAdmin(session.user.email);
    if (approved) {
      pendingEmailEl.textContent = '';
      showScreen('dashboard');
      loadLeads();
      loadTraffic();
    } else {
      pendingEmailEl.textContent = session.user.email;
      showScreen('pending');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (signupMode) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) {
        loginError.textContent = error.message;
        return;
      }
      if (!data.session) {
        loginError.textContent = 'Check your email to confirm your account, then sign in.';
        return;
      }
      afterAuth(data.session);
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = 'Invalid email or password.';
      return;
    }
    afterAuth(data.session);
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

  (async function checkSession() {
    const { data: { session } } = await client.auth.getSession();
    afterAuth(session);
  })();
})();
