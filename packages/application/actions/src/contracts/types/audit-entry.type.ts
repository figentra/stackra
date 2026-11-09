/**
 * Stackra file contract:
 * Purpose: `AuditEntry`, what the pipeline's audit step hands the `AuditTrail` port after every action call, and
 *          every query call of an API key: the call, when it ran, how it ended, the fields the handler added with
 *          `ctx.audit(...)`, the sent `Idempotency-Key`, the API version and the call's duration.
 * Boundary: a type only. A query is audited only for an API key caller (a credential, an `api_client` actor or an
 *           `api_key` origin); a refused call is audited with its refusal code, a call that failed with a bug is not
 *           (it never reached an outcome). No input or output body, and never the API key's secret: the descriptor
 *           carries the key's id, scopes and pin only.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 5: the pipeline's audit step audits every action); Pay's public API (STA-2532,
 *                     AC-008: an API key's calls are audited).
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

  /**
   * The `Idempotency-Key` the call ran under: the one the caller sent, or an approved call's `approval:<id>`; absent
   * when there was none (an input-derived key is never recorded).
   */
  readonly idempotencyKey?: string;

  /** The dated API version the call was answered in (`CallOptions.apiVersion`); absent for an unversioned call. */
  readonly apiVersion?: string;

  /** Milliseconds from the start of the call to this entry, by the pipeline clock; absent on an entry built elsewhere. */
  readonly durationMs?: number;
}
