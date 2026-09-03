-- Virtual-staging before/after examples, admin-managed the same way case
-- studies are: an admin uploads a pair of images (empty room + staged room)
-- and, once published, they appear as a comparison slider on the public
-- virtual-staging.html page. Replaces the single before/after pair that was
-- hardcoded into the page's HTML.
--
-- Unlike case_studies (which stores only text + an external link), these
-- rows point at real uploaded image files living in the "staging" Storage
-- bucket created below. The row stores the public URL of each image; the
-- bucket is public-read so the marketing page can display them, but only
-- admins can upload or delete.

create table staging_examples (
  id             uuid primary key default gen_random_uuid(),
  label          text,                 -- optional caption, e.g. "2BR apartment, Silver Spring"
  before_url     text not null,
  after_url      text not null,
  published      boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table staging_examples enable row level security;

create policy "Admins can view staging examples"
  on staging_examples for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage staging examples"
  on staging_examples for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- The public virtual-staging.html page reads this anonymously (no login),
-- same anon pattern as published case studies.
create policy "Public can view published staging examples"
  on staging_examples for select
  to anon
  using (published = true);

-- Storage bucket for the actual image files. Public so the marketing page's
-- <img> tags resolve without a signed URL; write/delete gated to admins.
insert into storage.buckets (id, name, public)
values ('staging', 'staging', true)
on conflict (id) do nothing;

create policy "Public can read staging images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'staging');

create policy "Admins can upload staging images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'staging'
    and exists (select 1 from admins where email = auth.jwt() ->> 'email')
  );

create policy "Admins can update staging images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'staging'
    and exists (select 1 from admins where email = auth.jwt() ->> 'email')
  );

create policy "Admins can delete staging images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'staging'
    and exists (select 1 from admins where email = auth.jwt() ->> 'email')
  );
