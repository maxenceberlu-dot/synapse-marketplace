-- ============================================================
-- Diagnostic : pourquoi les UPDATE sur « sessions » ne passent pas
-- ============================================================
-- Les politiques UPDATE existent, mais un PATCH anonyme renvoie
-- toujours « 0 ligne modifiée ». Cette requête montre pourquoi.
--
-- Point clé : une politique RESTRICTIVE (permissive = false) s'ajoute
-- en ET à toutes les autres — une seule qui échoue bloque tout.
-- ============================================================

SELECT
  tablename                                   AS "table",
  policyname                                  AS "politique",
  cmd                                         AS "action",
  CASE WHEN permissive = 'PERMISSIVE'
       THEN 'permissive (OU)'
       ELSE '⚠ RESTRICTIVE (ET — peut tout bloquer)'
  END                                         AS "type",
  roles::text                                 AS "rôles",
  coalesce(qual, '—')                         AS "condition USING",
  coalesce(with_check, '—')                   AS "condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'active_visitors')
ORDER BY tablename, cmd, policyname;
