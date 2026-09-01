-- Drops the tables/types built for two features that were abandoned during
-- development before ever going live: per-client Instagram OAuth connect
-- (client_social_accounts, client_social_tokens, oauth_states, and the
-- social_platform enum) and ad-account-via-Business-Manager tracking
-- (client_ad_accounts, created directly against this database but never
-- committed to git). The Edge Functions that used them
-- (instagram-connect-url, instagram-oauth-callback) have already been
-- undeployed. `clients`/`users` and their admin RLS policies stay -- the
-- Clients tab still uses them.

drop table if exists client_social_tokens;
drop table if exists client_social_accounts;
drop table if exists oauth_states;
drop table if exists client_ad_accounts;
drop type if exists social_platform;
