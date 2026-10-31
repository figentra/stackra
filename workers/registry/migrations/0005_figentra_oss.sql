-- Stackra file contract:
-- Purpose: the fifth D1 migration of the Stackra registry (owner decision, 2026-10-31): the `@figentra-oss` scope, an
--          `open` scope with the `open-source` licence rule for Figentra's open products, and its first trusted
--          publisher, `figentra/flow`, whose release workflow publishes Figentra Flow (MIT). Flow cannot publish to
--          `@figentra`, which is internal and commercial (0003).
-- Boundary: seed rows only, no schema change. Reads need no token, as `@stackra` (ADR 0453 decision 10); a publish must
--           name MIT or another open licence with a NOTICE. Publishers match per scope (ADR 0453 decision 6), so this
--           row lets figentra/flow publish any `@figentra-oss/*` name. Applied by CI with
--           `wrangler d1 migrations apply`; never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 6, 10 and 19; amendment of 2026-10-31).

INSERT INTO scopes (scope, read_rule, licence_rule, commercial_licence, created_at) VALUES
  ('@figentra-oss', 'open', 'open-source', 'SEE LICENSE IN LICENSE', '2026-10-31T00:00:00.000Z');

-- Repository and owner ids of figentra/flow from the GitHub API (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@figentra-oss', 'figentra/flow', '1432855858', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
