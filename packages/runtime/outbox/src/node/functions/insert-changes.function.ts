/**
 * Stackra file contract:
 * Purpose: `insertChanges`, the one statement that appends row changes to the retained change log: every entry of the
 *          batch in one bound JSON array, the scope columns taken from the transaction's scope settings
 *          (`app.scope_id`, `app.scope_path`), the order (`seq`) and the writing transaction (`tx`) from their column
 *          defaults.
 * Boundary: internal to `./node`; the flush writer runs it on the entity manager whose transaction is committing, the
 *           native-write watcher on the entity manager that ran the native statement, and the Postgres `ChangeFeed`
 *           driver on the running context's, so entries commit with the change or not at all. Nothing but the JSON
 *           array is bound.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0160 (raw SQL is parameterised); ADR 0327
 *                     (decisions 3 and 9: the scope settings).
 */
import type { Database } from "@stackra/database";

import type { ChangeRecord } from "#contracts/index";

/** The change log, in the package's schema. */
const TABLE = '"outbox"."changes"';

/**
 * Appends `entries` with `em`, in its transaction.
 *
 * @example
 * await insertChanges(database.em(), [{ change, meta: {}, occurredAt }]);
 */
export async function insertChanges(
  em: ReturnType<Database["em"]>,
  entries: readonly Omit<ChangeRecord, "position">[],
): Promise<void> {
  if (entries.length === 0) return;
  const rows = entries.map((entry) => ({
    type: entry.change.model,
    data: entry.change,
    meta: entry.meta,
    occurred_at: entry.occurredAt,
  }));
  // raw-sql: the scope columns read the transaction's scope settings, which an ORM insert cannot; one statement per batch
  await em.execute(
    `insert into ${TABLE} (type, data, meta, occurred_at, scope_id, scope_path) ` +
      "select c.type, c.data, c.meta, c.occurred_at, " +
      "nullif(current_setting('app.scope_id', true), ''), " +
      "nullif(current_setting('app.scope_path', true), '')::ltree " +
      "from jsonb_to_recordset(?::jsonb) as c(type text, data jsonb, meta jsonb, occurred_at timestamptz)",
    [JSON.stringify(rows)],
  );
}
