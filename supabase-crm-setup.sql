-- ================================================================
-- Supabase : table crm_leads pour le CRM Pulse Work (crm.html)
-- À exécuter dans Supabase SQL Editor (https://app.supabase.com)
-- Projet : iaaeerenmfyatlbtqylp
-- ================================================================

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS crm_leads (
  id                 bigserial PRIMARY KEY,
  submission_id      bigint UNIQUE REFERENCES lead_submissions(id),  -- NULL si lead ajouté à la main
  prenom             text,
  nom                text,
  email              text,
  entreprise         text,
  taille_entreprise  text,
  message            text,            -- message d'origine du formulaire
  source             text NOT NULL DEFAULT 'manuel',    -- 'formulaire' ou 'manuel'
  stage              text NOT NULL DEFAULT 'nouveau',   -- nouveau | contacte | demo | proposition | gagne | perdu
  produit            text,            -- solution Pulse concernée (obligatoire à partir de Démo)
  montant            numeric,         -- montant estimé en € (optionnel)
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage      ON crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);

-- 3. updated_at automatique à chaque modification
CREATE OR REPLACE FUNCTION crm_leads_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION crm_leads_set_updated_at();

-- 4. RLS : uniquement les utilisateurs authentifiés (toi via le login crm.html)
--    anon n'a AUCUN droit sur cette table.
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated all"
  ON crm_leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- Vérification rapide
-- ================================================================
-- SELECT stage, count(*), sum(montant) FROM crm_leads GROUP BY stage;
