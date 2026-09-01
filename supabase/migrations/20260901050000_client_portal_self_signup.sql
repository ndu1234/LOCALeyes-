-- Replaces the admin-initiated invite flow with client self-signup +
-- explicit admin approval. A client now creates their own account (company
-- name, contact info, email, password) and lands on a "pending approval"
-- screen -- clicking a link should never be the thing that grants access.
--
-- `portal_approved` is the gate: a client can always see their OWN
-- `clients` row (so the portal can show a pending-approval screen), but
-- every policy that exposes real business data now also requires
-- portal_approved = true. An admin flips it via the existing "Admins can
-- manage clients" policy -- no new admin-side policy needed.

alter table clients add column portal_approved boolean not null default false;

-- ── SELF-SIGNUP INSERT POLICIES ─────────────────────────────────────────
-- Scoped so a newly-authenticated user can only ever create a row for
-- themselves, never impersonate another email.

create policy "Users can create their own row"
  on users for insert
  to authenticated
  with check (email = auth.jwt() ->> 'email');

create policy "Clients can create their own pending client row"
  on clients for insert
  to authenticated
  with check (user_id = (select id from users where email = auth.jwt() ->> 'email'));

-- ── RE-GATE DATA ACCESS BEHIND portal_approved ──────────────────────────
-- "Clients can view their own client row" and "Clients can view their own
-- user row" are deliberately left as-is (not re-created here) -- a pending
-- client still needs to see their own row to know they're pending.

drop policy "Clients can view their own campaigns" on campaigns;
create policy "Clients can view their own campaigns"
  on campaigns for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ));

drop policy "Clients can view their own campaign metrics" on campaign_metrics;
create policy "Clients can view their own campaign metrics"
  on campaign_metrics for select
  to authenticated
  using (campaign_id in (
    select camp.id from campaigns camp
    join clients c on c.id = camp.client_id
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ));

drop policy "Clients can view their own invoices" on invoices;
create policy "Clients can view their own invoices"
  on invoices for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ));

drop policy "Clients can view their own content briefs" on content_briefs;
create policy "Clients can view their own content briefs"
  on content_briefs for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ));

drop policy "Clients can view their own ugc content" on ugc_content;
create policy "Clients can view their own ugc content"
  on ugc_content for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ));

drop policy "Clients can review their own ugc content" on ugc_content;
create policy "Clients can review their own ugc content"
  on ugc_content for update
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ))
  with check (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email' and c.portal_approved
  ));
