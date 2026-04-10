-- ConnectNPO Database Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

-- ============================================
-- organizations table
-- ============================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  mission text not null,
  focus_area text not null,
  annual_budget text not null,
  state text not null
);

-- Index on email for faster lookups
create index if not exists organizations_email_idx on organizations(email);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS on the table
alter table organizations enable row level security;

-- Policy 1: Anyone can insert (for onboarding form submissions)
create policy "Anyone can submit organization"
  on organizations
  for insert
  to anon, authenticated
  with check (true);

-- Policy 2: No public reads (keep data private for now)
-- We'll add read policies later when we add authentication
