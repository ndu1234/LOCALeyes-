-- Email the founder when a new lead arrives.
--
-- AFTER INSERT trigger on public.leads fires an async pg_net POST to the
-- notify-lead edge function. pg_net queues the request outside the
-- transaction, so a slow or dead email pipeline can never fail or delay the
-- lead insert itself.
--
-- The function is deployed without platform JWT verification (pg_net can't
-- mint a JWT), so requests authenticate with a shared secret instead: stored
-- once in Vault as "lead_webhook_secret" (never in this repo) and checked by
-- the function against its LEAD_WEBHOOK_SECRET env secret. If the Vault
-- secret hasn't been created yet the trigger sends nothing rather than
-- posting unauthenticated requests, and never raises -- lead capture must
-- work even when notifications are misconfigured.

create extension if not exists pg_net;

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'lead_webhook_secret';

  if v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://fczbikjoocfzxqzfpcia.supabase.co/functions/v1/notify-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-lead-secret', v_secret
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
exception when others then
  return new;
end;
$$;

-- Locked down: only the trigger machinery should run this (it reads Vault).
revoke execute on function public.notify_new_lead() from public, anon, authenticated;

drop trigger if exists trg_notify_new_lead on public.leads;
create trigger trg_notify_new_lead
  after insert on public.leads
  for each row
  execute function public.notify_new_lead();
