-- Stackra file contract:
-- Purpose: the first D1 migration of the Stackra registry (ADR 0453 decision 3): scopes, publishers, packages,
--          versions, dist-tags, hashed publish tokens, the audit log and daily downloads; seeds the two scope rows
--          (decision 10) and their trusted publishers (decision 6).
-- Boundary: schema and seed rows only. The licence tables (licences, licence_grants, licence_tokens, issuer_tokens)
--           are stackra-183's next migration. Applied by CI with `wrangler d1 migrations apply`; never edited once
--           applied: a change is a new numbered file.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 3, 6, 7, 10, 13, 19).

-- One row per scope; the read rule and the licence rule are data, never code (decision 10).
CREATE TABLE scopes (
  scope TEXT PRIMARY KEY,
  read_rule TEXT NOT NULL CHECK (read_rule IN ('open', 'licensed', 'internal')),
  licence_rule TEXT NOT NULL CHECK (licence_rule IN ('open-source', 'commercial')),
  -- The `license` value a commercial package must name, and an open-source package must not.
  commercial_licence TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- The trusted publisher of each scope, matched on the numeric ids as well as the names (decision 6).
CREATE TABLE publishers (
  scope TEXT NOT NULL REFERENCES scopes (scope),
  repository TEXT NOT NULL,
  repository_id TEXT NOT NULL,
  repository_owner_id TEXT NOT NULL,
  workflow TEXT NOT NULL,
  ref TEXT NOT NULL,
  environment TEXT NOT NULL,
  PRIMARY KEY (scope, repository_id)
);

CREATE TABLE packages (
  name TEXT PRIMARY KEY,
  scope TEXT NOT NULL REFERENCES scopes (scope),
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);
CREATE INDEX packages_modified ON packages (modified_at DESC, name);

-- Immutable once written, except `deprecated` (decision 7).
CREATE TABLE versions (
  name TEXT NOT NULL REFERENCES packages (name),
  version TEXT NOT NULL,
  kind TEXT NOT NULL,
  manifest TEXT NOT NULL,
  integrity TEXT NOT NULL,
  shasum TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  signatures TEXT NOT NULL,
  predicate_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  publisher_run TEXT NOT NULL,
  published_at TEXT NOT NULL,
  deprecated TEXT,
  PRIMARY KEY (name, version)
);

CREATE TABLE dist_tags (
  name TEXT NOT NULL REFERENCES packages (name),
  tag TEXT NOT NULL,
  version TEXT NOT NULL,
  PRIMARY KEY (name, tag)
);

-- Short-lived publish tokens from the OIDC exchange: the SHA-256 hash only, bound to one package name.
CREATE TABLE publish_tokens (
  hash TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  repository TEXT NOT NULL,
  run TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT,
  tag TEXT,
  actor TEXT NOT NULL,
  run TEXT NOT NULL,
  detail TEXT
);

-- Downloads per package, licence and day; '' is an open download. No IP address is stored (decision 13).
CREATE TABLE downloads_daily (
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  licence_id TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (day, name, licence_id)
);

INSERT INTO scopes (scope, read_rule, licence_rule, commercial_licence, created_at) VALUES
  ('@stackra', 'open', 'open-source', 'SEE LICENSE IN LICENSE', '2026-10-27T00:00:00.000Z'),
  ('@stackra-pro', 'licensed', 'commercial', 'SEE LICENSE IN LICENSE', '2026-10-27T00:00:00.000Z');

-- Repository and owner ids read from the GitHub API on 2026-10-27 (figentra = 314302700).
INSERT INTO publishers (scope, repository, repository_id, repository_owner_id, workflow, ref, environment) VALUES
  ('@stackra', 'figentra/stackra', '1425140001', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release'),
  ('@stackra-pro', 'figentra/stackra-pro', '1435812554', '314302700', '.github/workflows/release.yml', 'refs/heads/main', 'release');
