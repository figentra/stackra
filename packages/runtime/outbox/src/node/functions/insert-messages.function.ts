/**
 * Stackra file contract:
 * Purpose: `insertMessages`, the one statement that writes outbox messages: every row of the batch in one bound JSON
 *          array, the scope columns taken from the transaction's scope settings (`app.scope_id`, `app.scope_path`, set
 *          by `Database.withScope`, the ones row-level security reads).
 * Boundary: internal to `./node`; the Postgres driver runs it on the running context's entity manager and the flush
 *           writer on the entity manager whose transaction is committing, so the rows commit with the change or not at
 *           all. A write outside any scope stores no scope. Nothing but the JSON array is bound, so no value reaches the
 *           statement text.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4); ADR 0160 (raw SQL is parameterised); ADR 0327 (decisions 3 and 9: the
 *                     scope settings).
 */
import type { Database } from "@stackra/database";

import type { OutboxMessage } from "#contracts/index";

/** The message table, in the package's schema. */
const TABLE = '"outbox"."messages"';

/**
 * Writes `messages` with `em`, in its transaction.
 *
 * @example
 * await insertMessages(database.em(), [message]);
 */
export async function insertMessages(
  em: ReturnType<Database["em"]>,
  messages: readonly OutboxMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  const rows = messages.map((message) => ({
    id: message.id,
    kind: message.kind,
    type: message.type,
    data: message.data ?? null,
    meta: message.meta,
    occurred_at: message.occurredAt,
    available_at: message.availableAt,
  }));
  // raw-sql: the scope columns read the transaction's scope settings, which an ORM insert cannot; one statement per batch
  await em.execute(
    `insert into ${TABLE} (id, kind, type, data, meta, occurred_at, available_at, attempts, scope_id, scope_path) ` +
      "select m.id, m.kind, m.type, m.data, m.meta, m.occurred_at, m.available_at, 0, " +
      "nullif(current_setting('app.scope_id', true), ''), " +
      "nullif(current_setting('app.scope_path', true), '')::ltree " +
      "from jsonb_to_recordset(?::jsonb) as m(id text, kind text, type text, data jsonb, meta jsonb, " +
      "occurred_at timestamptz, available_at timestamptz)",
    [JSON.stringify(rows)],
  );
}
