-- Lets an admin pre-authorize a specific email for a client company at (or
-- after) creation, instead of only reacting to whatever a self-signup
-- happens to submit. When that email later signs up on the portal, it
-- claims this existing row (linking user_id and auto-approving) instead of
-- creating a second, disconnected clients row for the same company. An
-- unexpected signup (no matching authorized_email) still falls back to the
-- existing pending-row + manual-approval path -- this is additive, not a
-- replacement.

alter table clients add column authorized_email text;

-- One client per authorized email -- prevents two companies from both
-- claiming the same pre-authorization.
create unique index clients_authorized_email_unique on clients (authorized_email) where authorized_email is not null;

-- Scoped narrowly: a user can only claim a row where authorized_email
-- already equals their OWN authenticated email (an admin had to have set
-- that in advance -- the client can never write authorized_email itself,
-- only admins can via the existing "Admins can manage clients" policy),
-- and only while it's unclaimed (user_id is null), so an already-claimed
-- client can never be hijacked. The check clause pins user_id to their own
-- users row, so they can't claim it on someone else's behalf.
create policy "Users can claim their pre-authorized client row"
  on clients for update
  to authenticated
  using (authorized_email = auth.jwt() ->> 'email' and user_id is null)
  with check (
    authorized_email = auth.jwt() ->> 'email'
    and user_id = (select id from users where email = auth.jwt() ->> 'email')
  );
