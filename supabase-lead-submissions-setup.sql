-- ================================================================
-- Supabase : table lead_submissions pour backup des leads de contact
-- À exécuter dans Supabase SQL Editor (https://app.supabase.com)
-- Projet : iaaeerenmfyatlbtqylp
-- ================================================================

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS lead_submissions (
  id                 bigserial PRIMARY KEY,
  prenom             text,
  nom                text,
  email              text NOT NULL,
  entreprise         text,
  taille_entreprise  text,
  message            text,
  web3forms_status   text,           -- 'success' ou 'error'
  web3forms_error    text,           -- message d'erreur si échec
  user_agent         text,
  referrer           text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- 2. Index pour requêtes (par date, par statut, par email)
CREATE INDEX IF NOT EXISTS idx_lead_submissions_created_at ON lead_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_status     ON lead_submissions(web3forms_status);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_email      ON lead_submissions(email);

-- 3. RLS : autoriser INSERT depuis anon (pour que le formulaire client puisse écrire)
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

-- Policy : autoriser uniquement l'INSERT (anon ne peut PAS lire ni modifier les autres lignes)
CREATE POLICY "Allow anon insert"
  ON lead_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy : authenticated users (toi via dashboard Supabase) peuvent tout lire
CREATE POLICY "Allow authenticated read"
  ON lead_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- ================================================================
-- Vérification : récupérer les leads des 7 derniers jours
-- ================================================================
-- SELECT created_at, prenom, nom, email, entreprise, web3forms_status, web3forms_error
-- FROM lead_submissions
-- WHERE created_at > now() - interval '7 days'
-- ORDER BY created_at DESC;
