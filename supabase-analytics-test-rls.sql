-- ============================================================
-- Test décisif : la mise à jour d'une session passe-t-elle
-- réellement pour un visiteur anonyme ?
-- ============================================================
-- Depuis l'extérieur, impossible de conclure : la lecture est
-- réservée aux utilisateurs connectés, donc une mise à jour réussie
-- renvoie quand même « 0 ligne ». Ce script simule le rôle anonyme
-- À L'INTÉRIEUR de la base, où la lecture reste possible.
--
-- À exécuter dans Supabase → SQL Editor. N'écrit rien de permanent.
-- ============================================================

BEGIN;

-- 1. Un visiteur arrive : création de la session (comme le tracker)
INSERT INTO public.sessions
  (session_id, visitor_id, entry_page, exit_page, page_count, is_bounce)
VALUES
  ('s_test_rls', 'v_test_rls', '/test', '/test', 1, true);

-- 2. On se met dans la peau d'un visiteur anonyme
SET LOCAL ROLE anon;

-- 3. Ce que fait le tracker après 30 s, puis sur une 2e page
UPDATE public.sessions
   SET last_seen_at = now(),
       is_bounce    = false,
       page_count   = 2
 WHERE session_id = 's_test_rls';

-- 4. Retour en administrateur pour lire le résultat
RESET ROLE;

-- 5. VERDICT
SELECT
  session_id,
  last_seen_at,
  is_bounce,
  page_count,
  CASE
    WHEN last_seen_at IS NOT NULL AND is_bounce = false
      THEN '✅ CORRIGÉ — la durée et le taux de rebond seront désormais justes'
    ELSE '❌ TOUJOURS BLOQUÉ — la politique UPDATE ne s''applique pas au rôle anon'
  END AS verdict
FROM public.sessions
WHERE session_id = 's_test_rls';

-- 6. Rien n'est conservé
ROLLBACK;
