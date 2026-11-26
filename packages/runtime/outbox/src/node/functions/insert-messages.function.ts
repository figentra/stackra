/**
 * Stackra file contract:
 * Purpose: `insertMessages`, the one statement that writes outbox messages: every row of the batch in one bound JSON
 *          array, the scope columns taken from the transaction's scope settings (`app.scope_id`, `app.scope_path`, set
 *          by `Database.withScope`, the ones row-level security reads).
 * Boundary: internal to `./node`; the Postgres driver runs it on the running context's entity manager and the flush
 *           writer on the entity manager whose transaction is committing, so the rows commit with the change or not at
 *           all. A write outside any scope stores no scope. `tenant_id` is never named: its default takes the
 *           transaction's `app.tenant_id`, so a row is the call's tenant's and never one from input; a write with no
 *           tenant is a platform row, which no tenant's erasure can rewrite, so it must carry no personal data: a batch
 *           holding an event whose class declares a `@Classified` field first reads the transaction's tenant and,
 *           with none, refuses the whole batch before writing (`PlatformPersonalEventError`, STA-2629). Nothing
 *           but the JSON array is bound, so no value reaches the statement text.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4); ADR 0160 (raw SQL is parameterised); ADR 0327 (decisions 3 and 9: the
 *                     scope settings); ADR 0239 (2026-11-07 amendment, gap C); ADR 0189 (decision 2).
 */
import type { Database } from "@stackra/database";
import { Classified } from "@stackra/validation";

import { MessageKind } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { PlatformPersonalEventError } from "#core/errors/platform-personal-event.error";
import { wireVersionOf } from "#core/functions/wire-version-of.function";

/** The message table, in the package's schema. */
const TABLE = '"outbox"."messages"';

/** The first event message whose class declares a personal (`@Classified`) field, if any. */
function personalEvent(messages: readonly OutboxMessage[]): OutboxMessage | undefined {
  return messages.find((message) => {
    if (message.kind !== MessageKind.Event) return false;
    const wire = wireVersionOf(message.type);
    return wire !== undefined && Classified.members(wire.type).size > 0;
  });
}

/**
 * Writes `messages` with `em`, in its transaction.
 *
 * @throws PlatformPersonalEventError when an event declaring a personal field is written with no tenant.
 * @example
 * await insertMessages(database.em(), [message]);
 */
export async function insertMessages(
  em: ReturnType<Database["em"]>,
  messages: readonly OutboxMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  const personal = personalEvent(messages);
  if (personal !== undefined) {
    // raw-sql: reads the transaction's tenant setting, the one the rows' tenant default takes; nothing is bound
    const rows = (await em.execute(
      "select nullif(current_setting('app.tenant_id', true), '') as owner",
    )) as readonly { readonly owner?: unknown }[];
    if (typeof rows[0]?.owner !== "string")
      throw PlatformPersonalEventError.create({ type: personal.type });
  }
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
