-- Activates the dormant `ugc_creators`/`content_briefs`/`ugc_content` tables
-- (scaffolded in init_schema.sql, RLS enabled with zero policies until now)
-- for the new admin UGC pipeline: a global creator roster, content briefs
-- per client, and submissions (linking a brief to a creator) with a
-- review status. Same admin-allowlist RLS pattern as every other
-- admin-managed table in this project. `users` already has admin policies
-- from an earlier migration -- creator roster rows reference a `users` row
-- for name/email, same as clients do.

create policy "Admins can view ugc creators"
  on ugc_creators for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage ugc creators"
  on ugc_creators for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can view content briefs"
  on content_briefs for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage content briefs"
  on content_briefs for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can view ugc content"
  on ugc_content for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage ugc content"
  on ugc_content for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
