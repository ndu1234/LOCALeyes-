-- Lightweight first-party analytics: unique-visitor pageviews and service
-- card clicks. No PII, no IP addresses — just an anonymous client-generated
-- visitor id (stored in localStorage), the path, and for clicks, which
-- service was clicked. Feeds the admin dashboard's traffic chart and lays
-- groundwork for future A/B testing.

create type analytics_event_type as enum ('pageview', 'service_click');

create table analytics_events (
  id           uuid primary key default gen_random_uuid(),
  event_type   analytics_event_type not null,
  visitor_id   uuid not null,
  path         text not null,
  service_name text,
  created_at   timestamptz not null default now()
);

create index analytics_events_created_at_idx on analytics_events(created_at);
create index analytics_events_type_idx on analytics_events(event_type);

alter table analytics_events enable row level security;

-- Any visitor can record their own events, but never read them back.
create policy "Anyone can record analytics events"
  on analytics_events for insert
  to anon
  with check (true);

-- Only approved admins can read analytics.
create policy "Admins can view analytics events"
  on analytics_events for select
  to authenticated
  using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- Basic flood guard, same pattern as the leads throttle: cap total inserts
-- per minute so the public insert endpoint can't be trivially abused.
create or replace function prevent_analytics_flood()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from analytics_events where created_at > now() - interval '1 minute') >= 600 then
    raise exception 'Too many events right now.';
  end if;
  return new;
end;
$$;

create trigger analytics_events_prevent_flood
  before insert on analytics_events
  for each row
  execute function prevent_analytics_flood();
