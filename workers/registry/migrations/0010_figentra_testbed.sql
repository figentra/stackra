-- Stackra file contract:
-- Purpose: the tenth D1 migration of the Stackra registry (ADR 0522 decision 2: the testbed moves to its own
--          repository and publishes `@figentra/testbed`): `figentra/testbed` becomes a trusted publisher of the
--          `@figentra` scope, so its release workflow publishes `@figentra/testbed` (STA-2073).
-- Boundary: one seed row, no schema change. Publishers match per scope (ADR 0453 decision 6), so this row lets the
--           repository publish any `@figentra/*` name; it publishes only `@figentra/testbed` by convention of its
--           release workflow. The scope's `internal` read rule and `commercial` licence rule (0003) apply. The
--           release workflow calls figentra/stackra's reusable `runway-npm.yml`; the OIDC `workflow_ref` still names
--           the caller, `figentra/testbed/.github/workflows/release.yml`, which is what this row matches.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19; amendment of 2026-11-03); ADR 0522 (decision 2).

-- Repository and owner ids of figentra/testbed from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/testbed', '1444563429', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
