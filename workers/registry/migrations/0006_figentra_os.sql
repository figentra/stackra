-- Stackra file contract:
-- Purpose: the sixth D1 migration of the Stackra registry (ADR 0453 decision 10: the `@figentra` row's OS publisher
--          is added by the first OS batch that publishes): `figentra/os` becomes a trusted publisher of the `@figentra`
--          scope, so its release workflow publishes the template lines runway checks out (ADR 0481):
--          `@figentra/os-console`, `@figentra/os-landing` and `@figentra/os-mobile`.
-- Boundary: one seed row, no schema change. Publishers match per scope (ADR 0453 decision 6), so this row lets
--           figentra/os publish any `@figentra/*` name; OS publishes only `@figentra/os-*` names by convention of its
--           release workflow. The scope's `internal` read rule and `commercial` licence rule (0003) apply.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19); ADR 0481.

-- Repository and owner ids of figentra/os from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/os', '1427748269', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
