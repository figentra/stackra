/**
 * Stackra file contract:
 * Purpose: `STORED_MESSAGE_COLUMNS`, the zod fields of the columns `outbox.messages` and `outbox.changes` share: the
 *          metadata, the instant and the scope of the transaction that wrote the row.
 * Boundary: internal to `./node`; the Postgres outbox and change feed drivers spread it into their row schemas, so both
 *           read these columns the same way, and `scopeOfRow` reads the scope from what they parse.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0327 (decisions 3 and 9: the scope settings).
 */
import { z } from "zod";

/** The shared row columns, by column name. */
export const STORED_MESSAGE_COLUMNS = Object.freeze({
  meta: z.record(z.string(), z.unknown()),
  occurred_at: z.coerce.date(),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
});
