-- Activates the dormant `invoices` table (scaffolded in init_schema.sql, RLS
-- enabled with zero policies until now) for the new "manage client" billing
-- section. Same admin-allowlist RLS pattern as every other admin-managed
-- table in this project.

create policy "Admins can view invoices"
  on invoices for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "Admins can manage invoices"
  on invoices for all
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
