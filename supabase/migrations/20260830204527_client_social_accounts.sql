-- Activates the previously-dormant `clients`/`users` tables (scaffolded in
-- init_schema.sql, never wired to any RLS policy or UI until now) and adds
-- storage for per-client social account connections (Instagram first).
--
-- Security design: connection *metadata* (platform, username, connected_at)
-- lives in `client_social_accounts`, readable by admins the same way leads
-- are -- an admin needs to see "connected as @handle" in the dashboard.
-- The actual OAuth *access token* lives in a SEPARATE table,
-- `client_social_tokens`, with RLS enabled and NO policies granted to
-- `anon` or `authenticated` at all -- only the service_role key (used
-- exclusively inside the Supabase Edge Function that talks to Meta's API,
-- never in browser-side code) can ever read or write a token. This makes it
-- architecturally impossible for the admin dashboard's client-side JS to
-- fetch a raw token, even via a bug -- not just a policy choice, a missing
-- policy.

-- ── ACTIVATE `users` / `clients` (RLS was enabled with zero policies) ──────

create policy "Admins can view users"
  on users for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage users"
  on users for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can view clients"
  on clients for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage clients"
  on clients for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- ── SOCIAL CONNECTIONS ──────────────────────────────────────────────────────

create type social_platform as enum ('instagram');

create table client_social_accounts (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid not null references clients(id) on delete cascade,
  platform                    social_platform not null,
  username                    text,
  instagram_business_account_id text,
  page_id                     text,
  connected_by_email          text,
  connected_at                timestamptz not null default now(),
  unique (client_id, platform)
);

create index client_social_accounts_client_id_idx on client_social_accounts(client_id);

alter table client_social_accounts enable row level security;

create policy "Admins can view social account connections"
  on client_social_accounts for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- No insert/update/delete policy for authenticated/anon here on purpose --
-- writes only ever happen from the Edge Function (service_role), right
-- after it validates the OAuth callback. The admin dashboard triggers the
-- connect flow but never writes this table directly.

create table client_social_tokens (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references clients(id) on delete cascade,
  platform           social_platform not null,
  access_token       text not null,
  token_expires_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (client_id, platform)
);

create index client_social_tokens_client_id_idx on client_social_tokens(client_id);

alter table client_social_tokens enable row level security;

-- Deliberately no policies at all for anon/authenticated (see comment at
-- top of file) -- service_role (Edge Functions only) bypasses RLS entirely,
-- which is the only way this table is ever read or written.
