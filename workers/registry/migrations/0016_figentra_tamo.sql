-- Stackra file contract:
-- Purpose: the sixteenth D1 migration of the Stackra registry: `figentra/tamo` becomes a trusted publisher of the
--          `@figentra` scope, so its release workflow publishes Tamo's service contracts
--          (`@figentra/tamo-service-tamo-contract`, ADR 0511), as billing, notify and invoicing already do.
-- Boundary: one seed row, no schema change. Publishers match per scope (ADR 0453 decision 6), so this row lets the
--           repository publish any `@figentra/*` name; it publishes only its contracts by convention of its release
--           workflow. The scope's `internal` read rule and `commercial` licence rule (0003) apply. Applied by CI with
--           `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6 and 10); ADR 0511 (decisions 4 and 5).

-- Repository and owner ids of figentra/tamo from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/tamo', '1435861386', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
