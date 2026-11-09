-- Stackra file contract:
-- Purpose: the twelfth D1 migration of the Stackra registry (ADR 0511 decisions 4 and 5: each producer repository
--          releases its own service contracts through one trusted publisher): `figentra/notify` becomes a trusted
--          publisher of the `@figentra` scope, so its release workflow publishes
--          `@figentra/notify-service-{notifications,messaging,realtime-presence}-contract`, which figentra/os and the
--          products read once the three services left os (STA-2176).
-- Boundary: one seed row, no schema change. Publishers match per scope (ADR 0453 decision 6), so this row lets the
--           repository publish any `@figentra/*` name; it publishes only its own services' contracts by convention
--           of its release workflow. The scope's `internal` read rule and `commercial` licence rule (0003) apply.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19); ADR 0511 (decisions 1 to 5).

-- Repository and owner ids of figentra/notify from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/notify', '1448273981', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
