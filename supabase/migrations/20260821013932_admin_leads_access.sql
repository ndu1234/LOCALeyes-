-- Let the admin account read and update leads through the private admin
-- dashboard. Restricted to a specific email (not "any authenticated user"),
-- so even if someone else signs up for an account, they still can't see or
-- touch lead data unless their email matches.

create policy "Admin can view leads"
  on leads for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'gloryndu51@gmail.com');

create policy "Admin can update leads"
  on leads for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'gloryndu51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'gloryndu51@gmail.com');
