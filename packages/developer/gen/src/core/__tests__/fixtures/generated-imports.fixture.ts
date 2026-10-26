/**
 * Stackra file contract:
 * Purpose: `GENERATED_IMPORTS`, the `@stackra/*` packages gen's emitters can import (wiring driver entries, tool
 *          configs, the test setup, entries), declared by a fixture IR so the undeclared-package check on every
 *          generated file stays quiet in tests that are not about it (STA-1296).
 * Boundary: test data only. `@stackra/database` and `@stackra/i18n` are left out: declaring them changes what gen
 *           writes (the database testing import, the i18n target).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1293 (undeclared packages refused).
 */

/** Every `@stackra/*` package a generated file may import, but database and i18n. */
export const GENERATED_IMPORTS: readonly string[] = [
  "actions",
  "app",
  "clients",
  "config",
  "container",
  "content",
  "contracts",
  "errors",
  "events",
  "experience",
  "iam",
  "integrations",
  "ledger",
  "locking",
  "media",
  "model",
  "money",
  "navigation",
  "outbox",
  "panel",
  "queue",
  "rules",
  "scheduler",
  "search",
  "segments",
  "settings",
  "testing",
  "tsdown-config",
  "validation",
  "versioning",
  "vitest-config",
  "webhooks",
].map((name) => `@stackra/${name}`);
