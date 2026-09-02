-- Case studies infrastructure: lets an admin feature a REAL client's real
-- results on the public case-studies page, instead of it only ever showing
-- the static placeholder examples baked into the HTML. Deliberately tied to
-- a real clients row (client_id not null) -- the whole point is that these
-- are honest, traceable results, not copy an admin invented. The headline
-- stat/blurb/chips are still admin-written (a compelling one-line summary
-- isn't something to auto-generate from raw metrics), but they're written
-- about a real, identifiable client and can be updated as results change.
--
-- `published` is the gate: only published rows are visible to the public
-- (anon) page. Everything else works exactly like every other admin-managed
-- table in this project until it's published.

create table case_studies (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  industry_tag   text not null,
  brand_name     text not null,
  headline_stat  text not null,
  blurb          text not null,
  chips          text[],
  link_url       text,
  published      boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create index case_studies_client_id_idx on case_studies(client_id);

alter table case_studies enable row level security;

create policy "Admins can view case studies"
  on case_studies for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage case studies"
  on case_studies for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- The public case-studies.html page reads this anonymously (no login) --
-- same anon-role pattern already used for analytics_events.
create policy "Public can view published case studies"
  on case_studies for select
  to anon
  using (published = true);
