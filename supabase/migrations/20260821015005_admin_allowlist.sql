-- Replace the single-hardcoded-email admin check with an allowlist table.
-- Anyone can sign up for an account (Supabase Auth), but only emails in
-- `admins` actually get access to lead data or the dashboard.

create table admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- A signed-in user may check whether *their own* email is on the list
-- (needed both for the "am I approved" UI check and for the leads-policy
-- subquery below). They can never see other admins' emails this way.
create policy "Users can check their own admin status"
  on admins for select
  to authenticated
  using (email = auth.jwt() ->> 'email');

-- Existing admins can approve new ones directly from the dashboard.
create policy "Admins can add new admins"
  on admins for insert
  to authenticated
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- Seed the first admin.
insert into admins (email) values ('gloryndu51@gmail.com');

-- Swap the leads policies from a hardcoded email to the allowlist.
drop policy if exists "Admin can view leads" on leads;
drop policy if exists "Admin can update leads" on leads;

create policy "Admins can view leads"
  on leads for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can update leads"
  on leads for update
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
