-- Add notification tracking fields to organizations table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

-- Track when the last grant alert email was sent
alter table organizations add column if not exists last_notified_at timestamptz;

-- Track if user wants to receive email alerts (default: true)
alter table organizations add column if not exists email_alerts_enabled boolean not null default true;

-- Allow server to read organizations for sending alerts
-- Using service role key or RLS policy for anon read
drop policy if exists "Allow read for grant alerts" on organizations;
create policy "Allow read for grant alerts"
  on organizations
  for select
  to anon, authenticated
  using (true);
