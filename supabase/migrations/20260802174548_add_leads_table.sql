-- Public inbound inquiries from the website's Contact / "Book a Call" form.
-- Distinct from `clients`, which represents onboarded, managed accounts.

create type lead_status as enum ('new', 'contacted', 'converted', 'closed');

create table leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null,
  business_name       text,
  phone               text,
  service_interested  text,
  budget_range        text,
  message             text,
  status              lead_status not null default 'new',
  created_at          timestamptz not null default now()
);

alter table leads enable row level security;

-- Public site visitors (anon key) may submit a lead, but cannot read, update,
-- or delete any leads — only the service_role key (server-side/admin) can.
create policy "Anyone can submit a lead"
  on leads for insert
  to anon
  with check (true);
