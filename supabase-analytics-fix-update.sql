-- ============================================================
-- Pulse Analytics — correctif : durée moyenne à 0s et rebond à 100 %
-- ============================================================
-- Diagnostic (2026-08-29) :
-- Les tables « sessions » et « active_visitors » autorisent l'INSERT
-- pour les visiteurs anonymes, mais PAS l'UPDATE. Or le tracker met à
-- jour la session en continu (heartbeat toutes les 30 s, changement de
-- page, sortie). Ces mises à jour renvoyaient « HTTP 200, 0 ligne
-- modifiée » — un échec SILENCIEUX, invisible dans la console.
--
-- Conséquences observées dans le dashboard :
--   • last_seen_at jamais renseigné  → durée moyenne toujours 0s
--   • is_bounce jamais repassé à false → taux de rebond toujours 100 %
--
-- À exécuter une fois dans Supabase → SQL Editor.
-- ============================================================

-- 1. Nettoyage de la ligne de diagnostic (si elle subsiste)
DELETE FROM public.sessions        WHERE session_id = 's_diag_claude';
DELETE FROM public.active_visitors WHERE session_id = 's_diag_claude';

-- 2. Autoriser la mise à jour des sessions RÉCENTES uniquement.
--    La restriction temporelle (2 h) limite la casse en cas d'abus :
--    un tiers ne peut pas réécrire l'historique, seulement une session
--    en cours — ce que fait légitimement le tracker.
DROP POLICY IF EXISTS "anon update recent sessions" ON public.sessions;
CREATE POLICY "anon update recent sessions"
  ON public.sessions
  FOR UPDATE
  TO anon
  USING  (started_at > now() - interval '2 hours')
  WITH CHECK (started_at > now() - interval '2 hours');

-- 3. Idem pour les visiteurs en temps réel (bandeau « X visiteurs en ligne »)
DROP POLICY IF EXISTS "anon update active visitors" ON public.active_visitors;
CREATE POLICY "anon update active visitors"
  ON public.active_visitors
  FOR UPDATE
  TO anon
  USING  (true)
  WITH CHECK (true);

-- 4. Vérification : les politiques UPDATE doivent apparaître ici
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'active_visitors')
ORDER BY tablename, cmd;
