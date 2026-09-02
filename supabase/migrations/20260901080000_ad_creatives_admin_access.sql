-- Activates the dormant `ad_creatives` table (scaffolded in init_schema.sql,
-- RLS enabled with zero policies until now) -- the actual ad creative
-- (headline/body copy/CTA/asset) that runs for a campaign, optionally built
-- from an approved UGC submission. Same admin-allowlist RLS pattern as
-- every other admin-managed table in this project. Not exposed to the
-- client portal -- ad creative production is an internal LOCALeyes step,
-- not something clients review directly (they review the raw UGC
-- submission instead, via the existing content-brief flow).

create policy "Admins can view ad creatives"
  on ad_creatives for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage ad creatives"
  on ad_creatives for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
