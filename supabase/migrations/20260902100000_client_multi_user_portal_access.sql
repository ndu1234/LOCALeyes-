-- Lets a client company have MULTIPLE people with independent portal
-- logins, each individually approved -- up to now `clients.user_id` was a
-- single nullable FK, so a company could only ever have one portal login.
-- `clients.authorized_email` had the same one-per-company limit for
-- pre-authorization.
--
-- Two new tables replace what those columns did. `clients.user_id` and
-- `clients.authorized_email` are left in place, untouched, unused -- no
-- existing data is destroyed, only superseded.
--
--   client_users             -- membership: which users have (or are
--                                requesting) access to which client, each
--                                independently approved. A new teammate
--                                joining an already-approved client still
--                                needs their OWN approval -- they don't
--                                inherit it from an existing approved
--                                teammate.
--   client_authorized_emails -- pre-authorization: an admin can authorize
--                                an email for instant access to a specific
--                                client. A client can now have many of
--                                these (inviting multiple teammates); a
--                                single email can still only ever be
--                                authorized for ONE client (global
--                                uniqueness, matching the old column).
--
-- Every policy that resolves "which client does this authenticated user
-- belong to" is rewritten below to go through client_users instead of the
-- old clients.user_id join. Access to real business data (campaigns,
-- campaign_metrics, invoices, content_briefs, ugc_content) still requires
-- portal_approved = true; a client's own row (company_name, for the
-- pending-approval screen) does not require approval, only membership.

-- ── SCHEMA ───────────────────────────────────────────────────────────────

create table client_users (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  portal_approved boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (client_id, user_id)
);
create index client_users_client_id_idx on client_users(client_id);
create index client_users_user_id_idx on client_users(user_id);

create table client_authorized_emails (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  email      text not null unique,
  created_at timestamptz not null default now()
);
create index client_authorized_emails_client_id_idx on client_authorized_emails(client_id);

alter table client_users enable row level security;
alter table client_authorized_emails enable row level security;

-- ── ONE-TIME DATA MIGRATION ──────────────────────────────────────────────
-- Carries forward every existing single-column relationship so no existing
-- access is lost. Production has exactly one real linked user today
-- (heavalex / izrmani123@gmail.com, portal_approved = true) -- verified by
-- hand after this migration runs, not modified by it.

insert into client_users (client_id, user_id, portal_approved)
select id, user_id, portal_approved
from clients
where user_id is not null;

insert into client_authorized_emails (client_id, email)
select id, authorized_email
from clients
where authorized_email is not null;

-- ── ADMIN ACCESS (same allowlist pattern as every other admin-managed
--    table in this project) ─────────────────────────────────────────────

create policy "Admins can view client users"
  on client_users for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage client users"
  on client_users for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can view client authorized emails"
  on client_authorized_emails for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage client authorized emails"
  on client_authorized_emails for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- ── CLIENT-SIDE ACCESS TO THE NEW TABLES THEMSELVES ─────────────────────
-- A user may see only their OWN client_users row(s) (never a teammate's,
-- and never another client's) -- portal.js needs this to look up which
-- client it belongs to. Approval itself is admin-only: there is
-- deliberately no client-side UPDATE policy on client_users, so a client
-- can never flip their own portal_approved.

create policy "Users can view their own client_users rows"
  on client_users for select
  to authenticated
  using (user_id = (select id from users where email = auth.jwt() ->> 'email'));

-- A user may see only the client_authorized_emails row matching their OWN
-- email -- needed both for portal.js to detect an instant-claim, and for
-- the exists() check inside the INSERT policy below (a nested RLS-governed
-- select is itself filtered by the querying role's own policies, so this
-- is required for that check to ever find a match, not just for direct
-- reads from portal.js).
create policy "Users can view their own authorized email row"
  on client_authorized_emails for select
  to authenticated
  using (email = auth.jwt() ->> 'email');

-- The pre-authorization claim used to be a UPDATE against an unclaimed
-- clients row. It's now an INSERT into client_users, scoped so a user can
-- only ever insert a row for (a) themselves (user_id resolved from their
-- own JWT email, never someone else's), and (b) EITHER a client_id an
-- admin has pre-authorized their exact email for (instant-approve,
-- portal_approved = true) OR any client_id at all when there's no such
-- authorization (the ordinary self-signup "request access, wait for
-- approval" path, portal_approved = false). A pending row never grants
-- access to a client's actual business data -- every policy that exposes
-- campaigns/invoices/briefs/content still requires portal_approved = true,
-- so this stays bounded to the same "pending" visibility a client's own
-- row already carries.
create policy "Users can request or claim client portal access"
  on client_users for insert
  to authenticated
  with check (
    user_id = (select id from users where email = auth.jwt() ->> 'email')
    and (
      (portal_approved = true and exists (
        select 1 from client_authorized_emails cae
        where cae.client_id = client_users.client_id
          and cae.email = auth.jwt() ->> 'email'
      ))
      or
      (portal_approved = false and not exists (
        select 1 from client_authorized_emails cae
        where cae.client_id = client_users.client_id
          and cae.email = auth.jwt() ->> 'email'
      ))
    )
  );

-- ── RETIRE THE OLD SINGLE-COLUMN CLAIM MECHANISM ─────────────────────────
-- Fully superseded by the INSERT policy above -- dropped (not just
-- unused) so the deprecated authorized_email/user_id columns can never be
-- reactivated as a live access path, even by an admin later hand-editing
-- them directly.

drop policy "Users can claim their pre-authorized client row" on clients;
drop policy "Users can view their pre-authorized client row" on clients;

-- ── SELF-SIGNUP: NEW clients ROW NO LONGER LINKS user_id ────────────────
-- Self-signup still creates a fresh clients row for a new company, but the
-- follow-up client_users row is what actually grants membership now, so
-- this policy no longer needs (or permits) writing the deprecated
-- user_id column.
drop policy "Clients can create their own pending client row" on clients;
create policy "Clients can create their own pending client row"
  on clients for insert
  to authenticated
  with check (user_id is null);

-- ── OWN CLIENT ROW: membership only, no approval filter ──────────────────
-- A pending user still needs to see their own client's company_name to
-- render the "pending approval" screen.

drop policy "Clients can view their own client row" on clients;
create policy "Clients can view their own client row"
  on clients for select
  to authenticated
  using (id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email'
  ));

-- ── BUSINESS DATA: membership AND portal_approved = true ─────────────────

drop policy "Clients can view their own campaigns" on campaigns;
create policy "Clients can view their own campaigns"
  on campaigns for select
  to authenticated
  using (client_id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email' and cu.portal_approved
  ));

drop policy "Clients can view their own campaign metrics" on campaign_metrics;
create policy "Clients can view their own campaign metrics"
  on campaign_metrics for select
  to authenticated
  using (campaign_id in (
    select camp.id from campaigns camp
    where camp.client_id in (
      select cu.client_id from client_users cu
      join users u on u.id = cu.user_id
      where u.email = auth.jwt() ->> 'email' and cu.portal_approved
    )
  ));

drop policy "Clients can view their own invoices" on invoices;
create policy "Clients can view their own invoices"
  on invoices for select
  to authenticated
  using (client_id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email' and cu.portal_approved
  ));

drop policy "Clients can view their own content briefs" on content_briefs;
create policy "Clients can view their own content briefs"
  on content_briefs for select
  to authenticated
  using (client_id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email' and cu.portal_approved
  ));

drop policy "Clients can view their own ugc content" on ugc_content;
create policy "Clients can view their own ugc content"
  on ugc_content for select
  to authenticated
  using (client_id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email' and cu.portal_approved
  ));

drop policy "Clients can review their own ugc content" on ugc_content;
create policy "Clients can review their own ugc content"
  on ugc_content for update
  to authenticated
  using (client_id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email' and cu.portal_approved
  ))
  with check (client_id in (
    select cu.client_id from client_users cu
    join users u on u.id = cu.user_id
    where u.email = auth.jwt() ->> 'email' and cu.portal_approved
  ));
