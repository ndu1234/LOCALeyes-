-- Fixes the pre-authorization claim silently doing nothing: Postgres RLS
-- requires a row to be visible under a SELECT policy before an UPDATE
-- policy's USING clause can target it at all. The claim UPDATE policy
-- existed, but with no matching SELECT policy for an unclaimed
-- authorized_email row, it had zero rows to act on -- the update affected
-- nothing and silently fell through to creating a new pending client
-- instead of claiming the pre-authorized one.

create policy "Users can view their pre-authorized client row"
  on clients for select
  to authenticated
  using (authorized_email = auth.jwt() ->> 'email' and user_id is null);
