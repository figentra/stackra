-- Stackra file contract:
-- Purpose: the fourth D1 migration of the Stackra registry (owner decision, 2026-10-29): `figentra/commerce` becomes
--          a trusted publisher of the `@figentra` scope, so its release workflow publishes the shared Commerce
--          packages the product repos install (`@figentra/commerce-packs`, `@figentra/commerce-rules`, labelling and
--          the sales service client).
-- Boundary: one seed row, no schema change. Publishers match per scope (ADR 0453 decision 6), so this row lets
--           figentra/commerce publish any `@figentra/*` name; Commerce publishes only `@figentra/commerce-*` names by
--           convention of its release workflow. The scope's `internal` read rule and `commercial` licence rule
--           (0003) apply: each package names `SEE LICENSE IN LICENSE`, ships a LICENSE file, no `src/` and no `.map`.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19); ADR 0442.

-- Repository and owner ids of figentra/commerce from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/commerce', '1432717046', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
