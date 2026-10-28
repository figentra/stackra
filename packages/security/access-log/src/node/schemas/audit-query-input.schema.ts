/**
 * Stackra file contract:
 * Purpose: `AuditQueryInput`, the input of `access_log.audit_log_entry.search@1`: optional filters by call, action key,
 *          actor, outcome and time, with the cursor page fields.
 * Boundary: a shape class in its own file. The tenant is never a filter: the table's policy shows only the caller's
 *           tenant (R-59). The cursor is the sequence of the last record of the previous page, as text. It registers
 *           its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); the HTTP conventions
 *                     (cursor pagination); ADR 0465 (decision 4).
 */
import { CursorInput, Field, registerSchemas, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * Which write audits to read, newest first.
 *
 * @example
 * await pipeline.execute(AuditQuery, { actorId: "usr_01H…", limit: 50 }, { actor });
 */
export class AuditQueryInput extends CursorInput {
  /** Only the records of this call. */
  @Str({ max: 64 })
  callId?: string;

  /** Only the calls of this action key (`orders.order.cancel@1`). */
  @Str({ max: 200 })
  key?: string;

  /** Only the calls whose actor has this public id. */
  @Str({ max: 64 })
  actorId?: string;

  /** Only `ok` or only `refused` calls. */
  // reason: a two-value literal union kept as `AuditEntry` publishes it
  @Field(z.enum(["ok", "refused"]))
  outcome?: "ok" | "refused";

  /** Only calls at or after this instant. */
  from?: Date;

  /** Only calls before this instant. */
  to?: Date;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AuditQueryInput,
    z.object({
      cursor: z
        .string()
        .regex(/^[1-9]\d{0,15}$/)
        .exactOptional(),
      limit: z.number().int().min(1).max(100).default(20),
      callId: z.string().max(64).exactOptional(),
      key: z.string().max(200).exactOptional(),
      actorId: z.string().max(64).exactOptional(),
      outcome: z.enum(["ok", "refused"]).exactOptional(),
      from: z.coerce.date().exactOptional(),
      to: z.coerce.date().exactOptional(),
    }),
  ],
]);
