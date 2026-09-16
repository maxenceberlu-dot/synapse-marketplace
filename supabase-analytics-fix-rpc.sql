-- ============================================================
-- Pulse Analytics — correctif définitif : durée 0s et rebond 100 %
-- ============================================================
-- DIAGNOSTIC (16/09/2026, vérifié en base) :
-- Les tables sessions et active_visitors n'ont AUCUNE politique SELECT
-- pour le rôle « anon » — la lecture est réservée aux utilisateurs
-- connectés. Or en PostgreSQL, un UPDATE ... WHERE doit d'abord POUVOIR
-- LIRE la ligne qu'il cible. Le visiteur anonyme n'en voyant aucune, ses
-- mises à jour ne trouvaient rien : « 0 ligne modifiée », sans erreur.
--
-- Prouvé en transaction : le même UPDATE renvoie 0 ligne sans politique
-- SELECT, et 1 ligne dès qu'on en ajoute une.
--
-- Conséquences : last_seen_at restait égal à started_at (durée toujours
-- 0 s) et is_bounce restait à true (rebond toujours 100 %).
--
-- POURQUOI PAS SIMPLEMENT OUVRIR LA LECTURE :
-- la clé « anon » est publique (elle est dans le JavaScript du site).
-- Une politique SELECT permettrait à quiconque de lire l'historique de
-- navigation de tous les visiteurs. On passe donc par deux fonctions
-- qui s'exécutent avec les droits du propriétaire : le tracker peut
-- écrire ce qui le concerne, sans qu'aucune lecture ne soit exposée.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Mise à jour d'une session (heartbeat, changement de page, sortie)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_session(
  p_session_id text,
  p_exit_page  text DEFAULT NULL,
  p_page_count integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.sessions
     SET last_seen_at = now(),
         exit_page    = coalesce(p_exit_page, exit_page),
         page_count   = coalesce(p_page_count, page_count),
         -- une session devient « engagée » dès la 2e page vue
         is_bounce    = CASE WHEN coalesce(p_page_count, page_count) > 1
                             THEN false ELSE is_bounce END
   WHERE session_id = p_session_id
     -- garde-fou : on ne peut pas réécrire l'historique, seulement une
     -- session en cours. Limite la casse si la clé publique est détournée.
     AND started_at > now() - interval '4 hours';
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Présence temps réel (bandeau « X visiteurs en ligne »)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_visitor(
  p_session_id text,
  p_visitor_id text,
  p_page_url   text DEFAULT NULL,
  p_page_title text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.active_visitors (session_id, visitor_id, page_url, page_title, last_seen)
  VALUES (p_session_id, p_visitor_id, p_page_url, p_page_title, now())
  ON CONFLICT (session_id) DO UPDATE
    SET page_url   = excluded.page_url,
        page_title = excluded.page_title,
        last_seen  = now();
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Droits : seuls les visiteurs du site appellent ces fonctions
-- ─────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.touch_session(text, text, integer) FROM public;
REVOKE ALL ON FUNCTION public.touch_visitor(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.touch_session(text, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_visitor(text, text, text, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Ménage : les politiques UPDATE devenues inutiles
--    (elles ne servaient à rien puisque la lecture bloquait en amont)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon update recent sessions"  ON public.sessions;
DROP POLICY IF EXISTS "anon_update_sessions"         ON public.sessions;
DROP POLICY IF EXISTS "anon update active visitors"  ON public.active_visitors;
DROP POLICY IF EXISTS "av_anon_update"               ON public.active_visitors;

-- Vérification
SELECT proname AS fonction,
       pg_get_function_identity_arguments(oid) AS parametres,
       prosecdef AS droits_proprietaire
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('touch_session', 'touch_visitor');
