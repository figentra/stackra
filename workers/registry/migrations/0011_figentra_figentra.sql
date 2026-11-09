-- Stackra file contract:
-- Purpose: the eleventh D1 migration of the Stackra registry (ADR 0500 decision 2: `@figentra/cli` publishes to the
--          `@figentra` internal scope from figentra/figentra): `figentra/figentra` becomes a trusted publisher of the
--          `@figentra` scope, so its release workflow publishes the `figentra` CLI that core installs.
-- Boundary: one seed row, no schema change. Publishers match per scope (ADR 0453 decision 6), so this row lets
--           figentra/figentra publish any `@figentra/*` name; it publishes only `@figentra/cli` today. The scope's
--           `internal` read rule and `commercial` licence rule (0003) apply.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19); ADR 0500 (decisions 1 to 3).

-- Repository and owner ids of figentra/figentra from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/figentra', '1435864013', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
