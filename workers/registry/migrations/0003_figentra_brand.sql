-- Stackra file contract:
-- Purpose: the third D1 migration of the Stackra registry (owner decision D9, 2026-10-28; brand rules §32 amends brand
--          ADR 0001): the `@figentra` scope with the `internal` read rule (ADR 0453 decision 10), so only a licence
--          with `internal = 1` and a grant on `@figentra` reads it, and its first trusted publisher, `figentra/brand`,
--          whose release workflow publishes the brand kits `@figentra/brand-<id>` (figentra, os, stackra, commerce,
--          pay, tamo, academorix, mezzora, juristra, organza, jute, velora).
-- Boundary: seed rows only, no schema change. Publishers match per scope (ADR 0453 decision 6), not per name: this
--           row lets figentra/brand publish any `@figentra/*` name, and the brand kits are named `@figentra/brand-*`
--           by convention of the brand release workflow. The licence rule is `commercial` (proprietary assets): each
--           kit names `SEE LICENSE IN LICENSE`, ships a LICENSE file, no `src/` and no `.map`. The internal licence and
--           its `@figentra` grant are inserted by the owner (README "Internal licences"), never by the licence API.
--           Applied by CI with `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19); ADR 0461 (decision 3); stackra-215 (STA-1372).

INSERT INTO scopes (scope, read_rule, licence_rule, commercial_licence, created_at) VALUES
  ('@figentra', 'internal', 'commercial', 'SEE LICENSE IN LICENSE', '2026-10-28T00:00:00.000Z');

-- Repository and owner ids of figentra/brand from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra', 'figentra/brand', '1435586184', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'brand-registry');
