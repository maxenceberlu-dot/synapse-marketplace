-- ================================================================
-- Supabase : table todo_tasks pour Pulse To-Do (todo.html)
-- À exécuter dans Supabase SQL Editor (https://app.supabase.com)
-- Projet : iaaeerenmfyatlbtqylp
-- ================================================================

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS todo_tasks (
  id            bigserial PRIMARY KEY,
  title         text NOT NULL,
  description   text,                                   -- optionnelle, dépliée au clic sur le titre
  tag           text,                                   -- tag libre : client / projet (ex. FDJ)
  rank          double precision,                       -- ordre manuel (drag & drop)
  due_date      date,                                   -- échéance → onglet "Actions long terme" (agenda)
  importance    int  NOT NULL DEFAULT 3
                CHECK (importance BETWEEN 1 AND 5),     -- = points gagnés à la complétion
  done          boolean NOT NULL DEFAULT false,
  completed_at  timestamptz,                            -- rempli quand done passe à true
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_todo_tasks_done_created ON todo_tasks(done, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_completed_at ON todo_tasks(completed_at DESC);

-- 3. updated_at automatique à chaque modification
CREATE OR REPLACE FUNCTION todo_tasks_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_todo_tasks_updated_at ON todo_tasks;
CREATE TRIGGER trg_todo_tasks_updated_at
  BEFORE UPDATE ON todo_tasks
  FOR EACH ROW EXECUTE FUNCTION todo_tasks_set_updated_at();

-- 4. RLS : uniquement les utilisateurs authentifiés (toi via le login todo.html)
--    anon n'a AUCUN droit sur cette table.
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated all" ON todo_tasks;
CREATE POLICY "Allow authenticated all"
  ON todo_tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- Vérification rapide
-- ================================================================
-- SELECT count(*) FILTER (WHERE done) AS terminees,
--        coalesce(sum(importance) FILTER (WHERE done), 0) AS score_total
-- FROM todo_tasks;
