-- 990 Readiness Quiz: Lead capture table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  org_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  revenue_range TEXT,
  org_type TEXT,
  fiscal_year_end TEXT,
  score INT NOT NULL,
  grade TEXT NOT NULL,
  weak_categories TEXT[],
  answers JSONB,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE INDEX IF NOT EXISTS idx_quiz_leads_email ON quiz_leads(email);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created_at ON quiz_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_grade ON quiz_leads(grade);

-- RLS: 비활성 (서버사이드 SERVICE_KEY로만 insert하므로 불필요)
-- 나중에 anon key로 접근할 일이 생기면 RLS 켜고 policy 추가
ALTER TABLE quiz_leads DISABLE ROW LEVEL SECURITY;

-- 확인 쿼리
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quiz_leads';
