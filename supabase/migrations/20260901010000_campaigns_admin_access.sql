-- Activates the dormant `campaigns`/`campaign_metrics` tables (scaffolded in
-- init_schema.sql, RLS enabled with zero policies until now) for the new
-- admin "manage client" view: campaigns run for a client, with daily
-- performance metrics entered against each one. Same admin-allowlist RLS
-- pattern as every other admin-managed table in this project.

create policy "Admins can view campaigns"
  on campaigns for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage campaigns"
  on campaigns for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can view campaign metrics"
  on campaign_metrics for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage campaign metrics"
  on campaign_metrics for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
