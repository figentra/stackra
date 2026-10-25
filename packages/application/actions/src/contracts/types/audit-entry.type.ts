/**
 * Stackra file contract:
 * Purpose: `AuditEntry`, what the pipeline's audit step hands the `AuditTrail` port after every action call: the
 *          call, when it ran, how it ended and the fields the handler added with `ctx.audit(...)`.
 * Boundary: a type only. Written for actions, never for queries; a refused call is audited with its refusal code, a
 *           call that failed with a bug is not (it never reached an outcome).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 5: the pipeline's audit step audits every action).
 */
import type { Json } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/** One audited action call. */
export interface AuditEntry {
  /** The action call this entry audits. */
  readonly call: CallDescriptor;

  /** The pipeline clock's reading at the start of the call. */
  readonly at: Date;

  /** `ok`, or `refused` with the refusal's `code`. */
  readonly outcome: "ok" | "refused";

  /** The refusal code (`orders_paused`) of a refused call. */
  readonly code?: string;

  /** The fields the handler added with `ctx.audit(...)`, merged in call order. */
  readonly fields: Readonly<Record<string, Json>>;
}
