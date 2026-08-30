-- Carries the initiating admin's email through the OAuth round-trip so
-- client_social_accounts.connected_by_email can be set correctly by the
-- callback function (which runs unauthenticated -- Meta redirects the
-- browser there directly, so it has no session/JWT of its own to read).

alter table oauth_states add column connected_by_email text;
