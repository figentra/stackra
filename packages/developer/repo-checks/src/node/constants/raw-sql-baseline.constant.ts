/**
 * Stackra file contract:
 * Purpose: `RAW_SQL_BASELINE`, the raw SQL calls that had no `// raw-sql:` reason when the `raw-sql` check landed
 *          (stackra-288, 2026-10-29), per file, so the check holds every new call to ADR 0160 while these are given
 *          their reasons.
 * Boundary: data only; `structureFindings` passes a file's count to `checkRawSql`. A ratchet: lower a count (or drop
 *           the file) when its calls get their comments; never raise one or add a file.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1: each raw query carries a `// raw-sql:` reason); gap mo23 (stackra-288).
 */

/** Calls without a reason, per repository-relative file. */
export const RAW_SQL_BASELINE: Readonly<Record<string, number>> = Object.freeze({
  "packages/data/database/src/core/bases/crud-service.base.ts": 5,
  "packages/data/database/src/core/functions/maintain-partitions.function.ts": 2,
  "packages/data/database/src/core/functions/table-count.function.ts": 1,
  "packages/data/database/src/core/values/metrics-reader.value.ts": 14,
  "packages/data/database/src/node/drivers/database-health-indicator.driver.ts": 1,
  "packages/data/database/src/node/drivers/postgres-rate-limit-store.driver.ts": 1,
  "packages/data/database/src/node/functions/migrate.function.ts": 1,
  "packages/data/database/src/node/functions/open-migration-session.function.ts": 4,
  "packages/data/database/src/node/functions/open-seed-session.function.ts": 3,
  "packages/data/database/src/testing/functions/assert-row-security.function.ts": 11,
  "packages/runtime/outbox/src/node/drivers/postgres-change-feed.driver.ts": 1,
  "packages/runtime/workflow/src/node/drivers/postgres-workflow-journal.driver.ts": 2,
});
