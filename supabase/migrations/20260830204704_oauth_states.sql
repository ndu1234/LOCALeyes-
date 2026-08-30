-- Short-lived, one-time-use CSRF tokens for the Instagram "Connect" OAuth
-- flow. The admin dashboard never constructs Meta's OAuth URL itself (that
-- would mean a client_id could be passed straight through the `state`
-- param and forged by anyone who inspects the request) -- instead it asks
-- the instagram-connect-url Edge Function for a URL, which mints a random
-- `state`, records which LOCALeyes client it's for here, and the
-- instagram-oauth-callback function consumes (deletes) the row to look
-- up which client the callback belongs to. A row that's never consumed
-- (abandoned flow) is harmless -- just cleaned up by expiry, never usable
-- twice.

create table oauth_states (
  state       text primary key,
  client_id   uuid not null references clients(id) on delete cascade,
  platform    social_platform not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '15 minutes')
);

alter table oauth_states enable row level security;

-- No policies for anon/authenticated -- only the two Edge Functions
-- (service_role) ever read or write this table, same reasoning as
-- client_social_tokens.
