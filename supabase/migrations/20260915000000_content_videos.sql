-- Admin-managed showcase videos for the Content Creation service page, built
-- on the same pattern as staging_examples: an admin uploads a video file (and
-- optionally a poster image), and once published it appears in the gallery on
-- services/ugc-content.html.
--
-- Like staging_examples these rows point at real uploaded files, here living in
-- the "content-videos" Storage bucket created below. The row stores each file's
-- public URL; the bucket is public-read so the marketing page can play the
-- video without a signed URL, but only admins can upload or delete.
--
-- poster_url is optional but recommended: without one, browsers (iOS Safari
-- especially) render an unplayed <video> as a black rectangle.

create table content_videos (
  id             uuid primary key default gen_random_uuid(),
  label          text,                 -- optional caption, e.g. "Skincare brand testimonial"
  video_url      text not null,
  poster_url     text,                 -- optional thumbnail shown before play
  published      boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table content_videos enable row level security;

create policy "Admins can view content videos"
  on content_videos for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage content videos"
  on content_videos for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- The public services/ugc-content.html page reads this anonymously (no login),
-- same anon pattern as published staging examples and case studies.
create policy "Public can view published content videos"
  on content_videos for select
  to anon
  using (published = true);

-- Storage bucket for the video and poster files. Public so the marketing
-- page's <video> tag resolves without a signed URL; write/delete gated to
-- admins. The 50MB cap matches the project's storage file_size_limit -- a
-- larger file fails at the API regardless, so capping here makes the limit
-- explicit rather than surfacing as an opaque upload error.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-videos',
  'content-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime',
        'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Public can read content videos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'content-videos');

create policy "Admins can upload content videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'content-videos'
    and exists (select 1 from admins where email = auth.jwt() ->> 'email')
  );

create policy "Admins can update content videos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'content-videos'
    and exists (select 1 from admins where email = auth.jwt() ->> 'email')
  );

create policy "Admins can delete content videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'content-videos'
    and exists (select 1 from admins where email = auth.jwt() ->> 'email')
  );
