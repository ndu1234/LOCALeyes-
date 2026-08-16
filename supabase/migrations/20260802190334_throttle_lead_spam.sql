-- Rate-limit the public lead-submission endpoint at the database layer, so it
-- can't be bypassed by scripting directly against the REST API instead of the
-- website's form.

create or replace function prevent_lead_spam()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Same email submitting again within 5 minutes: block (duplicate/bot resubmits).
  if exists (
    select 1 from leads
    where email = new.email
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'Too many submissions from this email. Please wait a few minutes and try again.';
  end if;

  -- Global flood guard: more than 20 leads in the last minute, from anyone.
  if (select count(*) from leads where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many submissions right now. Please try again shortly.';
  end if;

  return new;
end;
$$;

create trigger leads_prevent_spam
  before insert on leads
  for each row
  execute function prevent_lead_spam();
