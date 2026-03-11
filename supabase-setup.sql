-- ============================================
-- PULSE ANALYTICS - Supabase Setup
-- Execute this in Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- ============================================

-- TABLE 1: page_views
CREATE TABLE public.page_views (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id    TEXT NOT NULL,
  session_id    TEXT NOT NULL,
  page_url      TEXT NOT NULL,
  page_title    TEXT,
  referrer      TEXT DEFAULT '',
  utm_source    TEXT DEFAULT '',
  utm_medium    TEXT DEFAULT '',
  utm_campaign  TEXT DEFAULT '',
  utm_term      TEXT DEFAULT '',
  utm_content   TEXT DEFAULT '',
  device_type   TEXT DEFAULT 'desktop',
  browser       TEXT DEFAULT '',
  os            TEXT DEFAULT '',
  screen_width  INTEGER DEFAULT 0,
  screen_height INTEGER DEFAULT 0,
  language      TEXT DEFAULT '',
  country       TEXT DEFAULT '',
  timezone      TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pv_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_pv_page_url ON public.page_views (page_url);
CREATE INDEX idx_pv_visitor_id ON public.page_views (visitor_id);
CREATE INDEX idx_pv_session_id ON public.page_views (session_id);

-- TABLE 2: sessions
CREATE TABLE public.sessions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   TEXT NOT NULL UNIQUE,
  visitor_id   TEXT NOT NULL,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  page_count   INTEGER DEFAULT 1,
  entry_page   TEXT DEFAULT '',
  exit_page    TEXT DEFAULT '',
  is_bounce    BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_started_at ON public.sessions (started_at DESC);
CREATE INDEX idx_sessions_visitor_id ON public.sessions (visitor_id);

-- TABLE 3: active_visitors (real-time)
CREATE TABLE public.active_visitors (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id  TEXT NOT NULL,
  session_id  TEXT NOT NULL UNIQUE,
  page_url    TEXT NOT NULL,
  page_title  TEXT DEFAULT '',
  last_seen   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_av_last_seen ON public.active_visitors (last_seen DESC);
CREATE INDEX idx_av_session ON public.active_visitors (session_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_visitors ENABLE ROW LEVEL SECURITY;

-- ANON = tracking script (INSERT only for page_views)
CREATE POLICY "anon_insert_page_views" ON public.page_views
  FOR INSERT TO anon WITH CHECK (true);

-- ANON = sessions (INSERT + UPDATE)
CREATE POLICY "anon_insert_sessions" ON public.sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_sessions" ON public.sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ANON = active_visitors (INSERT + UPDATE + DELETE)
CREATE POLICY "anon_insert_av" ON public.active_visitors
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_av" ON public.active_visitors
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_av" ON public.active_visitors
  FOR DELETE TO anon USING (true);

-- AUTHENTICATED = dashboard (SELECT all)
CREATE POLICY "auth_select_page_views" ON public.page_views
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_select_sessions" ON public.sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_select_av" ON public.active_visitors
  FOR SELECT TO authenticated USING (true);

-- AUTHENTICATED = dashboard can also delete stale active visitors
CREATE POLICY "auth_delete_av" ON public.active_visitors
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- ENABLE REAL-TIME on active_visitors
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_visitors;

-- ============================================
-- DAILY STATS VIEW (for faster dashboard queries)
-- ============================================
CREATE OR REPLACE VIEW public.daily_stats AS
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS total_views,
  COUNT(DISTINCT visitor_id) AS unique_visitors,
  COUNT(DISTINCT session_id) AS total_sessions
FROM public.page_views
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Grant authenticated users access to the view
GRANT SELECT ON public.daily_stats TO authenticated;
