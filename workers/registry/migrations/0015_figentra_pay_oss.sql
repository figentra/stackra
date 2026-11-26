-- Stackra file contract:
-- Purpose: the fifteenth D1 migration of the Stackra registry (ADR 0453 decision 6): `figentra/pay` becomes a trusted
--          publisher of the `@figentra-oss` scope, so its release workflow publishes the public checkout widget
--          `@figentra-oss/pay-widget` (and later `@figentra-oss/pay-js`) that merchants embed (STA-2516).
-- Boundary: one seed row, no schema change. The scope's `open` read rule and `open-source` licence rule (0005) apply,
--           so the widget ships under its own open-source LICENSE, never the repository's commercial one. Applied by
--           CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19).

-- Repository and owner ids of figentra/pay from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra-oss', 'figentra/pay', '1435861177', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
