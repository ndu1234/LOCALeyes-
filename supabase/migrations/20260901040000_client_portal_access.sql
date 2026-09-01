-- RLS for the new client portal: an invited client logs in via Supabase
-- Auth (magic link) and should see ONLY their own company's data, never
-- another client's. Every policy here is scoped through
-- clients.user_id -> users.email = auth.jwt() ->> 'email', so a client can
-- never widen their own row into someone else's. These are additive to the
-- existing admin-only policies (RLS ORs all matching policies together) --
-- admins keep full access, clients get a narrow read (+ limited review)
-- slice on top.
--
-- Creator identity/rate (ugc_creators, and creators' own users rows) is
-- deliberately NOT exposed to clients -- that's internal LOCALeyes
-- information, so the portal shows submission type/file/status/feedback
-- only, no creator name.

create policy "Clients can view their own user row"
  on users for select
  to authenticated
  using (email = auth.jwt() ->> 'email');

create policy "Clients can view their own client row"
  on clients for select
  to authenticated
  using (user_id = (select id from users where email = auth.jwt() ->> 'email'));

create policy "Clients can view their own campaigns"
  on campaigns for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ));

create policy "Clients can view their own campaign metrics"
  on campaign_metrics for select
  to authenticated
  using (campaign_id in (
    select camp.id from campaigns camp
    join clients c on c.id = camp.client_id
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ));

create policy "Clients can view their own invoices"
  on invoices for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ));

create policy "Clients can view their own content briefs"
  on content_briefs for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ));

create policy "Clients can view their own ugc content"
  on ugc_content for select
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ));

-- Row-scoped to the client's own content -- correctly prevents any
-- cross-client access. Column-level restriction (status/feedback only,
-- not file_url/type/brief_id) is enforced by the portal UI, not the
-- database, for v1 -- a technically-savvy client could edit other columns
-- on their OWN rows via a crafted request, but never another client's row.
create policy "Clients can review their own ugc content"
  on ugc_content for update
  to authenticated
  using (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ))
  with check (client_id = (
    select c.id from clients c
    join users u on u.id = c.user_id
    where u.email = auth.jwt() ->> 'email'
  ));
