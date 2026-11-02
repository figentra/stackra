-- Stackra file contract:
-- Purpose: the eighth D1 migration of the Stackra registry (ADR 0511 decisions 4 and 5: each producer repository
--          releases its own service contracts through one trusted publisher): `figentra/pay` and
--          `figentra/invoicing` become trusted publishers of the `@figentra` scope, so their release workflows
--          publish `@figentra/pay-service-payments-contract` and `@figentra/invoicing-service-invoicing-contract`,
--          which figentra/billing's gen reads (STA-1905).
-- Boundary: two seed rows, no schema change. Publishers match per scope (ADR 0453 decision 6), so these rows let
--           each repository publish any `@figentra/*` name; each publishes only its own services' contracts by
--           convention of its release workflow. The scope's `internal` read rule and `commercial` licence rule (0003)
--           apply. Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19); ADR 0511 (decisions 1 to 5).

-- Repository and owner ids of figentra/pay and figentra/invoicing from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/pay', '1435861177', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release'),
  ('@figentra', 'figentra/invoicing', '1440593616', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
