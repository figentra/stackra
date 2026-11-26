/**
 * Stackra file contract:
 * Purpose: `RELEASED_BANNED_MIGRATIONS`, the released migrations that hold a statement ADR 0159 bans, written before gen
 *          classified migrations (STA-2866): the tenancy contract migrations that backfill `tenant_id` in place before
 *          `SET NOT NULL`, and an index built on an existing table without `CONCURRENTLY`. An applied migration is
 *          frozen, so gen keeps compiling them, classified `banned` and destructive; any other banned statement is
 *          refused (`migration_banned`).
 * Boundary: a frozen set of migration ids. Closed: a new migration never joins it; a banned change is rewritten as
 *           expand and contract instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; decision 4: forward fix only; the 2026-10-23 note: a released prefix does
 *                     not move).
 */

/** The released migration ids whose banned statements are frozen. */
export const RELEASED_BANNED_MIGRATIONS: ReadonlySet<string> = new Set<string>([
  // The tenancy contract migrations: an in-place `tenant_id` backfill before SET NOT NULL, and their unique indexes
  // built in the same transaction (released before STA-2866, #830 and its siblings).
  "outbox.0006_contract_outbox_tenancy",
  "privacy.0003_contract_privacy_tenancy",
  "queue.0003_contract_queue_tenancy",
  "scheduler.0002_contract_scheduler_tenancy",
  "search.0010_contract_search_index_tenancy",
  "settings.0004_contract_settings_tenancy",
  "webhooks.0003_contract_webhooks_tenancy",
  "workflow.0012_contract_journal_tenancy",
  // An HNSW index built on the existing vector_items table without CONCURRENTLY.
  "search.0004_create_vector_hnsw_index",
]);
