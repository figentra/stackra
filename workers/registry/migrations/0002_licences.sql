-- Stackra file contract:
-- Purpose: the second D1 migration of the Stackra registry, the licence engine (ADR 0453 decisions 13 and 14):
--          licences, their grants (one row per scope and name, `*` for every name), their tokens (SHA-256 hash only),
--          the issuer tokens of the licence API (hash only), the Idempotency-Key receipts of that API, and the per-name
--          read rules that tighten a scope's rule (ADR 0461 decision 3: `@stackra-pro/ui` is `internal`).
-- Boundary: schema and the one name-rule seed row; no issuer token: its hash is inserted by the owner from Infisical
--           `prod` `/registry` (README "Issuer tokens"), and a licence is made internal only by the owner (README
--           "Internal licences"), never through the licence API. Applied by CI with `wrangler d1 migrations apply`;
--           never edited once applied.
-- Runtime: Cloudflare D1 (SQLite)
-- Governing contract: ADR 0453 (decisions 3, 10, 13, 14 and 19); ADR 0461 (decision 3); stackra-183 (STA-1335).

-- One licence per customer contract; `holder_ref` is the opaque Figentra OS account reference.
CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  holder_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'revoked')),
  -- 1 for Figentra's own licences, the only ones that read an `internal` name (set by the owner, never by the API).
  internal INTEGER NOT NULL DEFAULT 0 CHECK (internal IN (0, 1)),
  not_before TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX licences_holder ON licences (holder_ref);

-- What a licence may read: one row per scope and name; the name `*` covers every name of the scope.
CREATE TABLE licence_grants (
  licence_id TEXT NOT NULL REFERENCES licences (id),
  scope TEXT NOT NULL REFERENCES scopes (scope),
  name TEXT NOT NULL,
  PRIMARY KEY (licence_id, scope, name)
);

-- One token per CI system or machine; the token itself is shown once and never stored.
CREATE TABLE licence_tokens (
  id TEXT PRIMARY KEY,
  licence_id TEXT NOT NULL REFERENCES licences (id),
  hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX licence_tokens_licence ON licence_tokens (licence_id);

-- The callers of the licence API (role `issuer`: Figentra OS billing and licensing), hash only.
CREATE TABLE issuer_tokens (
  hash TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

-- One receipt per applied Idempotency-Key: a retried call with the same request answers the stored body (an issued
-- token is never in it).
CREATE TABLE licence_requests (
  idempotency_key TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  status INTEGER NOT NULL,
  body TEXT NOT NULL,
  at TEXT NOT NULL
);

-- A per-name read rule inside a scope; it only tightens the scope's rule. An `internal` name is read only by an
-- internal licence whose grants cover it; a customer grant, `*` included, never does (ADR 0461 decision 3).
CREATE TABLE name_rules (
  name TEXT PRIMARY KEY,
  scope TEXT NOT NULL REFERENCES scopes (scope),
  read_rule TEXT NOT NULL CHECK (read_rule IN ('internal')),
  created_at TEXT NOT NULL
);

INSERT INTO name_rules (name, scope, read_rule, created_at) VALUES
  ('@stackra-pro/ui', '@stackra-pro', 'internal', '2026-10-27T00:00:00.000Z');
