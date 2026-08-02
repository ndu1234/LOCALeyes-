-- LocalEyes core schema: users, clients, campaigns, creative production, and billing.
-- Table creation order follows FK dependencies (users -> clients -> campaigns -> ugc_creators
-- -> content_briefs -> ugc_content -> ad_creatives -> campaign_metrics -> invoices).

create extension if not exists pgcrypto with schema extensions;

-- ── ENUMS ──────────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'client', 'creator');
create type client_status as enum ('active', 'paused', 'churned');
create type campaign_platform as enum ('meta', 'google', 'tiktok', 'youtube');
create type campaign_status as enum ('draft', 'live', 'paused', 'ended');
create type ad_format as enum ('image', 'video', 'carousel');
create type ad_status as enum ('draft', 'approved', 'rejected', 'live');
create type ugc_type as enum ('video', 'image', 'copy');
create type ugc_status as enum ('submitted', 'approved', 'rejected', 'revision');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');

-- ── USERS ──────────────────────────────────────────────────────────────────

create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  role       user_role not null default 'client',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ── CLIENTS ────────────────────────────────────────────────────────────────

create table clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  company_name text not null,
  industry     text,
  website      text,
  logo_url     text,
  status       client_status not null default 'active'
);

create index clients_user_id_idx on clients(user_id);

-- ── CAMPAIGNS ──────────────────────────────────────────────────────────────

create table campaigns (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  name       text not null,
  platform   campaign_platform,
  objective  text,
  budget     numeric,
  status     campaign_status not null default 'draft',
  start_date date,
  end_date   date
);

create index campaigns_client_id_idx on campaigns(client_id);

-- ── UGC_CREATORS ───────────────────────────────────────────────────────────

create table ugc_creators (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  niche          text[],
  rate_per_video numeric,
  portfolio_url  text,
  availability   boolean not null default true
);

create index ugc_creators_user_id_idx on ugc_creators(user_id);

-- ── CONTENT_BRIEFS ─────────────────────────────────────────────────────────

create table content_briefs (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  title          text not null,
  description    text,
  talking_points text[],
  do_dont        jsonb,
  deadline       date
);

create index content_briefs_client_id_idx on content_briefs(client_id);

-- ── UGC_CONTENT ────────────────────────────────────────────────────────────

create table ugc_content (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  creator_id uuid references ugc_creators(id) on delete set null,
  brief_id   uuid references content_briefs(id) on delete set null,
  file_url   text,
  type       ugc_type not null,
  status     ugc_status not null default 'submitted',
  feedback   text
);

create index ugc_content_client_id_idx on ugc_content(client_id);
create index ugc_content_creator_id_idx on ugc_content(creator_id);
create index ugc_content_brief_id_idx on ugc_content(brief_id);

-- ── AD_CREATIVES ───────────────────────────────────────────────────────────

create table ad_creatives (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  ugc_content_id  uuid references ugc_content(id) on delete set null,
  headline        text,
  body_copy       text,
  cta             text,
  asset_url       text,
  format          ad_format,
  status          ad_status not null default 'draft'
);

create index ad_creatives_campaign_id_idx on ad_creatives(campaign_id);
create index ad_creatives_ugc_content_id_idx on ad_creatives(ugc_content_id);

-- ── CAMPAIGN_METRICS ───────────────────────────────────────────────────────

create table campaign_metrics (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  date        date not null,
  impressions integer not null default 0,
  clicks      integer not null default 0,
  conversions integer not null default 0,
  spend       numeric not null default 0,
  roas        numeric,
  unique (campaign_id, date)
);

create index campaign_metrics_campaign_id_idx on campaign_metrics(campaign_id);

-- ── INVOICES ───────────────────────────────────────────────────────────────

create table invoices (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients(id) on delete cascade,
  amount           numeric not null,
  status           invoice_status not null default 'draft',
  due_date         date,
  stripe_invoice_id text
);

create index invoices_client_id_idx on invoices(client_id);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- RLS is enabled with no policies yet, so only the service_role key can read/write
-- until access policies are defined for admin/client/creator roles.

alter table users            enable row level security;
alter table clients          enable row level security;
alter table campaigns        enable row level security;
alter table ugc_creators     enable row level security;
alter table content_briefs   enable row level security;
alter table ugc_content      enable row level security;
alter table ad_creatives     enable row level security;
alter table campaign_metrics enable row level security;
alter table invoices         enable row level security;
